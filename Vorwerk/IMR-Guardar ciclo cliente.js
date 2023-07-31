function guardarCicloCliente(type, form) {
	
	//var recordType	= nlapiGetRecordType();
	//var recordId	= nlapiGetRecordId();

	if (type == 'create') {
		var nume 	= nlapiGetFieldValue('custrecord_imr_serie');
		var tipo 	= nlapiGetFieldValue('custrecord_imr_tipociclo');
		var fecha	= nlapiGetFieldValue('custrecord_imr_fecha');
		var conta	= nlapiGetFieldValue('custrecord_imr_contacto');
		
		/*var factura = '';
		var fechfac = '';
		var prese 	= '';
		var geren 	= '';
		var empresa = '';
		var correo 	= '';
		var dir 	= '';
		var tel 	= '';*/
		var entityId = '';

		if (nume != '') // busqueda por numero de serie en Ciclo Clientes:
						// Ventas con numeros de Series
		{
			var filters = new Array();
			filters.push(new nlobjSearchFilter('serialnumbers', null, 'is', nume));

			var resultado = returnBlank(nlapiSearchRecord('salesorder', 'customsearch664', filters, null)); // busqueda
			if (resultado != '') 
			{
				/*for (var i = 0; i < resultado.length; i++) 
				{*/
					entityId 		= returnBlank(resultado[0].getValue('entity'));
					/*factura 		= returnBlank(resultado[i].getText('billingtransaction'));
					fechfac 		= resultado[i].getValue('trandate','billingTransaction'); 
					//var lider 		= returnBlank(resultado[i].getValue('')); 
					prese 			= returnBlank(resultado[i].getText('salesrep')); 
					geren 			= returnBlank(resultado[i].getText('supervisor', 'salesRep'));
					var conta 		= returnBlank(resultado[i].getText('entityid', 'contactPrimary'));
					if(conta != '') 
					{
						correo = returnBlank(resultado[i].getValue('email', 'contactPrimary')); 
						dir = returnBlank(resultado[i].getValue('address', 'contactPrimary')); 
						tel = returnBlank(resultado[i].getValue('phone', 'contactPrimary'));
					}
					if (conta == '') 
					{
						conta = returnBlank(resultado[i].getText('custbodycontacto1'));
						if(conta != '') 
						{
							correo = returnBlank(resultado[i].getValue('custbodycontacto3')); 
							dir = returnBlank(resultado[i].getValue('custbodycontacto2')); 
							tel = returnBlank(resultado[i].getValue('custbodycontacto4'));
						}
						else 
						{
							conta = returnBlank(resultado[i].getText('companyname', 'customer'));
						}
					}*/
				//}
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
			}
		}
	}
}
// ------------------ Validaciones / Elimina duplicados ---------------//

function returnBlank(cad) {
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
};
