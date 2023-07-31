// Name of Script : NSO_Pago_CFDi_s.js
// Author         : Ivan Gonzalez - Netsoft - Mexico
// Date			  : 

//nlapiLogExecution('DEBUG','params: ' + params);
var id_mail_customer   = nlapiGetContext().getSetting('SCRIPT','custscript_id_field_mail_customer')||'custbody_email_cliente';


function XML_Pago_Object_CFDi(){
	
	this.invoice       = null;
    this.customer      = null;
    this.params        = null;
	this.setupcfdi     = null;
   	this.body          = "";	
	this.subtotal      = 0;
	this.subtotalbruto = 0;
	
	this.build = function(id, setupid) 
    {
		setupid  = setupid == null || setupid == "" ? 1 : setupid;
		var invoice     = nsoGetTranRecord(id); 
		var custid      = invoice.getFieldValue("customer");
		var customer    = nlapiLoadRecord("customer", custid);
		var params      = nlapiLoadRecord("customrecord_cfdisetup", setupid);
		var setupcfdi   = nlapiLoadRecord("customrecord_setup_cfdi", 1);	
	
		this.id          = id;
		this.invoice     = invoice;
		this.customer    = customer;
		this.params      = params;        
		this.setupid     = setupid;
	
		var version      = setupcfdi.getFieldValue('custrecord_cfdi_version');
		var timbra       = false;
		
		for (var j=1; j<= invoice.getLineItemCount('apply'); j++){
			var apply = invoice.getLineItemValue('apply', 'apply', j)||'F';
			if (apply == 'T'){
				timbra = true;
				break;
			}
		}
		var bodytext = ''
		if (timbra == true){
	
			bodytext = '<fx:FactDocMX xmlns:fx="http://www.fact.com.mx/schema/fx" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_f.xsd">';
			bodytext += '<fx:Version>'+ version +'</fx:Version>';
			bodytext += nlGetCFDiPago01(invoice, customer, params, setupcfdi);
			bodytext += nlGetCFDiPagoH4(invoice, customer, params, setupcfdi);
			bodytext += nlGetCFDiPago02(invoice, customer, params, setupcfdi);
			bodytext += nlGetCFDiPagoComp(invoice, customer, params, setupcfdi);
			bodytext += nlGetCFDiPagoEx(invoice, customer, params, setupcfdi);

			this.body = bodytext;
			bodytext  = ChartCode(bodytext);
		}//if (timbra == true){
		return bodytext;
	}// this.build = function(id, setupid, splitter, newline) 
}

function nlGetCFDiPago01(invoice, customer, params, setupcfdi)
{

    var folio         = invoice.getFieldValue('tranid');
	var emailsend     = params.getFieldValue('custrecord_cfdi_emailenvio')
	var emailcustomer = isNull(customer.getFieldValue('custentity_email'));
	if (emailcustomer == null || emailcustomer == ''){
		emailcustomer        = isNull(customer.getFieldValue('email'));
	}
	var sendemail     = setupcfdi.getFieldValue('custrecord_cfdi_mailalcliente');
	var emailtest     = setupcfdi.getFieldValue('custrecord_cfdi_email_send_test');
	var testing       = setupcfdi.getFieldValue('custrecord_cfdi_testing');
	var recordtype    = invoice.getRecordType();
	var confirmacion  = invoice.getFieldValue('custbody_cfdi_confirmacion')||'F';
	var retval        = '';
	var estadoemision = isNull(params.getFieldValue('custrecord_cfdi_estado_expedidoen'));
	var paisemision   = isNull(params.getFieldValue('custrecord_cfdi_pais_expedidoen'));
	var CPEmision     = isNull(params.getFieldValue('custrecord_cfdi_cp_expedidoen'));
	var tipodedocumento = getTipoDocumentoPago(invoice.getRecordType());
	
	retval += '<fx:Identificacion>';
	retval += '<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>';
	retval += '<fx:TipoDeComprobante>PAGO</fx:TipoDeComprobante>';	
	
	if(testing == 'T')	{
	 	retval += '<fx:RFCEmisor>' + setupcfdi.getFieldValue('custrecord_cfdi_rfctesting') + '</fx:RFCEmisor>';	
	}
	else{
		retval += '<fx:RFCEmisor>' + params.getFieldValue('custrecord_cfdi_rfcemisor') + '</fx:RFCEmisor>';	
	} 
	retval += '<fx:RazonSocialEmisor>' + isNull(params.getFieldValue('custrecord_cfdi_nombreemisor')) + '</fx:RazonSocialEmisor>';
	if(testing == 'T')	{
		retval += '<fx:Usuario>'+ isNull(setupcfdi.getFieldValue('custrecord_cfdi_user_testing')) +'</fx:Usuario>';
	}else{
		retval += '<fx:Usuario>' + params.getFieldValue('custrecord_cfdi_usuario') + '</fx:Usuario>';
	}
	
	retval += '<fx:NumeroInterno>' + tipodedocumento + ': '+ folio + '</fx:NumeroInterno>';
	retval += '<fx:LugarExpedicion>'  + CPEmision + '</fx:LugarExpedicion>';	
	if (confirmacion != 'F' && version == '7'){
		retval += '<fx:Confirmacion>' + setupcfdi.getFieldValue('custrecord_cfdi_confirmacion') + '</fx:Confirmacion>';
	}
		
	retval += '</fx:Identificacion>';
	
	
	var cfdirelacionado = ''
	var UUID         = invoice.getFieldValue('custbody_uuid')||'';
	var TipoRelacion = invoice.getFieldText('custbody_cfdi_tipode_relacion')||'';
	var arrayUUID    = new Array();
	var count        = 0;
	var docidUUID    = '';
	
	var relacionadosUUID = GetRelacionados(invoice)||'';
	if (relacionadosUUID.length > 0){
		arrayUUID = relacionadosUUID;
	}
	
	if(arrayUUID.length == 0 && UUID != '') {
		arrayUUID[0] = UUID;
	}

	if(TipoRelacion != '' && arrayUUID.length > 0){
		var arraytiporel = new Array();
		arraytiporel     = TipoRelacion.split('-');
		TipoRelacion     = arraytiporel[0];
		retval += '<fx:CfdiRelacionados>';	
		retval += '<fx:TipoRelacion>' + TipoRelacion + '</fx:TipoRelacion>';
		for (var a= 0; a < arrayUUID.length; a++){
			retval += '<fx:UUID>' + arrayUUID[a] + '</fx:UUID>';
		}
		retval += '</fx:CfdiRelacionados>';	
	}

	
	//------> Envio de correo a cuenta de pruebas
	if (testing == 'T' ){
		if(emailtest != null && emailtest != '') {
			retval += '<fx:Procesamiento>';
			retval += '<fx:Dictionary name="email">';
			retval += '<fx:Entry k="to" v="' +emailtest+'"/>';
			retval += '</fx:Dictionary>';
			retval += '</fx:Procesamiento>';
		}
	}
	else {
		//------> Envio de correo al cliente
		if (sendemail == 'T'){	
			if ((emailsend != null && emailsend != '')||(emailcustomer != null && emailcustomer != '')){
				retval += '<fx:Procesamiento>';
				retval += '<fx:Dictionary name="email">';
				if (emailcustomer != null && emailcustomer != '' && emailsend != null && emailsend != ""){
					retval += '<fx:Entry k="to" v="' + emailcustomer + ';'+ emailsend +'"/>';
				}
				else if((emailcustomer == null || emailcustomer == '') && emailsend != null && emailsend != ""){
					retval += '<fx:Entry k="to" v="' +emailsend+'"/>';
				}
				else if((emailsend == null || emailsend == '') && emailcustomer != null && emailcustomer != ""){
					retval += '<fx:Entry k="to" v="' + emailcustomer +'"/>';
				}
				retval += '</fx:Dictionary>';
				retval += '</fx:Procesamiento>';
			}
		}
		else{
			retval += '<fx:Procesamiento>';
			retval += '<fx:Dictionary name="email">';
			if (emailsend != null && emailsend != ""){
				retval += '<fx:Entry k="to" v="' + emailsend +'"/>';
			}		
			retval += '</fx:Dictionary>';
			retval += '</fx:Procesamiento>';
		}
	}
	
		
	//----> Datos Emisor	
	retval     += '<fx:Emisor>';	
	retval     += '<fx:DomicilioFiscal>';	
	var calle   = (params.getFieldValue('custrecord_cfdi_calleemisor'));	
	retval     += '<fx:Calle>' + calle + '</fx:Calle>'; 	   
	var numext = isNull(params.getFieldValue('custrecord_cfdi_numexterioremisor'));
	if (numext != null && numext != ''){
		retval += '<fx:NumeroExterior>' + numext + '</fx:NumeroExterior>'; 	    
	}	
	var numint = isNull(params.getFieldValue('custrecord_cfdi_numinterioremisor'));
	if (numint != null && numint != ''){																								
   	    retval += '<fx:NumeroInterior>' + numint + '</fx:NumeroInterior>'; 
	}	
	var localidad = isNull(params.getFieldValue('custrecord_cfdi_comext_localida'));
	if (localidad != null && localidad != ''){
    	retval += '<fx:Localidad>' + localidad + '</fx:Localidad>';    
	}
	var referencia = isNull(params.getFieldValue('custrecord_cfdi_referenciaemisor'));
	if (referencia != null && referencia != ''){
		retval += '<fx:Referencia>' + referencia + '</fx:Referencia>';   
	}	
	var colonia = isNull(params.getFieldValue('custrecord_cfdi_comext_colonia'));
	if (colonia != null && colonia != '' ){
    	retval += '<fx:Colonia>' + colonia + '</fx:Colonia>'; 
	}
	retval += '<fx:Municipio>'     + isNull(params.getFieldValue('custrecord_cfdi_municipioemisor'))      + '</fx:Municipio>';   
	retval += '<fx:Estado>'        + isNull(params.getFieldValue('custrecord_cfdi_estadoemisor'))         + '</fx:Estado>';	    
    retval += '<fx:Pais>'          + isNull(params.getFieldValue('custrecord_cfdi_paisemisor'))           + '</fx:Pais>'; 	    
	retval += '<fx:CodigoPostal>'  + isNull(params.getFieldValue('custrecord_cfdi_cpemisor'))             + '</fx:CodigoPostal>'; 
	retval += '</fx:DomicilioFiscal>';	
	
	//------------->Empiezan datos del lugar de emision <--------------------------------// 
	
	
	
	if( (estadoemision != null && estadoemision != '') && (paisemision != null && paisemision != '') && (CPEmision != null && CPEmision != '') ){
		retval += '<fx:DomicilioDeEmision>';
			
		var calleemi = isNull(params.getFieldValue('custrecord_cfdi_calleexpedidoen'));
		if (calleemi != null && calleemi != ''){
			retval += '<fx:Calle>' + calleemi + '</fx:Calle>'; 	   
		}	
		var numextemi = isNull(params.getFieldValue('custrecord_cfdi_numext_expedidoen'));
		if (numextemi != null && numextemi != '' ){
			retval += '<fx:NumeroExterior>' + numextemi + '</fx:NumeroExterior>'; 	    
		}	
					
		var localidademi = isNull(params.getFieldValue('custrecord_cdfi_loc_expedidoen'));
		if (localidademi != null && localidademi != '' ){
			retval += '<fx:Localidad>' + localidademi + '</fx:Localidad>';    
		}
		var referenciaemi = isNull(params.getFieldValue('custrecord_cfdi_ref_expedidoen'));
		if (referenciaemi != null && referenciaemi != ''){
			retval += '<fx:Referencia>' + referenciaemi + '</fx:Referencia>';   
		}	
		var coloniaemi = isNull(params.getFieldValue('custrecord_cfdi_colonia_expedidoen'));
		if (coloniaemi != null && coloniaemi != '') {
			retval += '<fx:Colonia>' + coloniaemi + '</fx:Colonia>'; 
		}
		var municipioemi = isNull(params.getFieldValue('custrecord_cfdi_mun_expedidoen'));
		retval += '<fx:Municipio>'  + municipioemi  + '</fx:Municipio>';   
		retval += '<fx:Estado>'     + estadoemision + '</fx:Estado>';	    
		retval += '<fx:Pais>'       + paisemision   + '</fx:Pais>'; 	    
		retval += '<fx:CodigoPostal>' + CPEmision + '</fx:CodigoPostal>';  		
		retval += '</fx:DomicilioDeEmision>';
	}// end if( (estadoemision != null && estadoemision != '') && (paisemision != null && paisemision != '') && (CPEmision != null && CPEmision != '') && cartaporte != 'T' ){
	
		
	retval += '<fx:RegimenFiscal>';
	var regfisc = isNull(params.getFieldText('custrecord_cfdi_regimenfiscal_ce'));
	var regArray = regfisc.split('-');
	var Regimen  = regArray[0];
	retval += '<fx:Regimen>' + Regimen + '</fx:Regimen>'
	retval += '</fx:RegimenFiscal>';	    	
	retval += '</fx:Emisor>';	
	retval  = retval.replace(/&/g, "&amp;");
	
	
    return retval;
}


function nlGetCFDiPagoH4(invoice, customer, params, setupcfdi)
{
  	var retval         = '';
	var idcustbodyRFC  = nlapiGetContext().getSetting('SCRIPT','custscript_id_custbody_rfc')||'custbody_rfc';
    var recRFC         = invoice.getFieldValue(idcustbodyRFC)||'';
	if (recRFC == ''){recRFC = customer.getFieldValue('custentity_rfc')}
	if ( recRFC != null && recRFC != ''){
		recRFC = recRFC.replace(/-/g, "");
		recRFC = recRFC.replace(/\s/g, "");
	}
	var codigopais     = '';
	var nombreenvio    = customer.getFieldValue('companyname');
	var retvalreceptor = '';
	for (var i = 1; i <= customer.getLineItemCount('addressbook'); i++){
  		var defaultbilling = (customer.getLineItemValue('addressbook', 'defaultbilling', i));
  		if (defaultbilling == 'T'){
			var codigopais    = nsoGetCountryNameComExt(customer.getLineItemValue('addressbook', 'country', i));
			var pais          = nsoGetCountryName(customer.getLineItemValue('addressbook', 'country', i));
			var callereceptor = (customer.getLineItemValue('addressbook', 'addr1', i));
			var colonia       = (customer.getLineItemValue('addressbook', 'addr2', i));
			var Municipio     = (customer.getLineItemValue('addressbook', 'city', i));
			var Estado        = (customer.getLineItemValue('addressbook', 'state', i));
			var CP            = (customer.getLineItemValue('addressbook', 'zip', i));		
			if (codigopais != null && codigopais != ''){
				retvalreceptor += '<fx:CdgPaisReceptor>' + customer.getLineItemValue('addressbook', 'country', i) + '</fx:CdgPaisReceptor>';
				retvalreceptor += '<fx:RFCReceptor>' + recRFC + '</fx:RFCReceptor>'; 
				if (nombreenvio != null && nombreenvio != '')
				{retvalreceptor += '<fx:NombreReceptor>' + nombreenvio + '</fx:NombreReceptor>';}
			}
			if ((callereceptor != null && callereceptor != '')||(Municipio != null && Municipio != '') || (Estado != null && Estado != '') ||(pais != null && pais != '') || (CP != null && CP != '') ){
				retvalreceptor += '<fx:Domicilio>';
				
				if (codigopais != 'MEX')	
				{retvalreceptor += '<fx:OtroDomicilio>';}
				else
				{retvalreceptor += '<fx:DomicilioFiscalMexicano>';}
				if (callereceptor != null && callereceptor != '')
				{retvalreceptor += '<fx:Calle>' + callereceptor + '</fx:Calle>';}   
				if (colonia != null && colonia != '')
				{retvalreceptor += '<fx:Colonia>' + colonia + '</fx:Colonia>';}
				if (Municipio != null && Municipio !='')
				{retvalreceptor += '<fx:Municipio>' + Municipio + '</fx:Municipio>';}
				if (Estado != null && Estado != '')
				{retvalreceptor += '<fx:Estado>' + Estado + '</fx:Estado>';}
				if (pais != null && pais != '')
				retvalreceptor += '<fx:Pais>' + pais + '</fx:Pais>';           
				if (CP != null && CP != '')
				{retvalreceptor += '<fx:CodigoPostal>' + CP + '</fx:CodigoPostal>';} 
				if (codigopais != 'MEX'){
					retvalreceptor += '</fx:OtroDomicilio>';}
				else
				{retvalreceptor += '</fx:DomicilioFiscalMexicano>';}
				retvalreceptor += '</fx:Domicilio>';
				//nlapiLogExecution('DEBUG','retvalreceptor ', retvalreceptor); 
			}
		}// end for (var i = 1; i <= customer.getLineItemCount('addressbook'); i++) 
	}
	retval += '<fx:Receptor>';	
	retval += retvalreceptor;
	if (codigopais != 'MEX' && codigopais != '' ){
		retval += '<fx:ResidenciaFiscal>' + codigopais + '</fx:ResidenciaFiscal>'; 
	}
	var usocfdi  = invoice.getFieldText("custbody_cfdi_uso_cfdi_pago")||'P01';
	var usoclave = '';
	if (usocfdi != ''){
		var usoArray = usocfdi.split('-');
		var usoclave = usoArray[0];	
	}
	retval += '<fx:UsoCFDI>' + usoclave + '</fx:UsoCFDI>'; 
	retval += '</fx:Receptor>';
	retval = retval.replace(/&/g, "&amp;");
	return retval;
}


function nlGetCFDiPago02(invoice, customer, params, setupcfdi){

	var ClaveUnidad   = setupcfdi.getFieldValue('custrecord_cfdi_claveunidad')||'ACT';
	var ClaveProdServ = setupcfdi.getFieldValue('custrecord_cfdi_claveprodserv')||'84111506';
	var Descripcion   = setupcfdi.getFieldValue('custrecord_cfdi_descripcion_pago')||'Pago';

	var retval = '<fx:Conceptos>';
	retval += '<fx:Concepto>';			
	retval += '<fx:Cantidad>1</fx:Cantidad>'; 
	retval += '<fx:ClaveUnidad>'   + ClaveUnidad + '</fx:ClaveUnidad>';
	retval += '<fx:ClaveProdServ>' + ClaveProdServ + '</fx:ClaveProdServ>';
	retval += '<fx:Descripcion>'   + Descripcion + '</fx:Descripcion>';
	retval += '<fx:ValorUnitario>0</fx:ValorUnitario>'; 
	retval += '<fx:Importe>0</fx:Importe>'; 
	retval += '</fx:Concepto>';	
	retval += '</fx:Conceptos>';
	retval += '<fx:Totales>'
    retval += '<fx:Moneda>XXX</fx:Moneda>'
    retval += '<fx:SubTotalBruto>0</fx:SubTotalBruto>'
    retval += '<fx:SubTotal>0</fx:SubTotal>'
    retval += '<fx:Total>0</fx:Total>'
    retval += '<fx:TotalEnLetra>cero  00/100</fx:TotalEnLetra>'
    retval += '</fx:Totales>'

	return retval;
}

function nlGetCFDiPagoComp(invoice, customer, params, setupcfdi){
	var idcampoxml      = nlapiGetContext().getSetting('SCRIPT','custscript_id_campo_xml')||'custbody_cfdixml';
		idcampoxml 		= idcampoxml.replace(/&/g, '&amp;');
	var retval          = '';
	var idcustbodyRFC   = nlapiGetContext().getSetting('SCRIPT','custscript_id_custbody_rfc')||'custbody_rfc';
	var idnumparcial    = nlapiGetContext().getSetting('SCRIPT','custscript_id_num_parcialidad')||'';
	var version         = setupcfdi.getFieldValue('custrecord_cfdi_versionpago')||'1.0';
	var moneda          = invoice.getFieldValue('currencysymbol');
	var tipodecambio    = nsoParseFloatOrZero(invoice.getFieldValue('exchangerate')).toFixed(2);
	var NumOperacion    = invoice.getFieldValue('custbody_cfdi_pymtref')||'';
	var codigopais      = '';
	var RfcEmisorCtaOrd = invoice.getFieldValue('custbody_xml_rfc_banco_origen')||'';
	var NomBancoOrdExt  = invoice.getFieldText('custbody_xml_conta_bancoorigen')||'';
	var CtaOrdenante    = invoice.getFieldValue('custbody_xml_conta_cuentaorigen')||'';
	var RfcEmisorCtaBen = invoice.getFieldValue('custbody_xml_rfc_banco_destino')||'';
	var recRFC          = invoice.getFieldValue(idcustbodyRFC)||'';
	
	if (recRFC == 'XEXX010101000' && NomBancoOrdExt == ''){
		var NomBancoOrdExt  = invoice.getFieldValue('custbody_xml_banco_origenext')||'';
	}
	var CtaBeneficiario = invoice.getFieldValue('custbody_xml_conta_cuentadestino')||'';
	var TipoCadPago     = invoice.getFieldText('custbody_cfdi_tipo_cadena_pago')||'';
	if (TipoCadPago != ''){
		var arraytipocad = TipoCadPago.split('-');
		TipoCadPago = arraytipocad[0]
	}
	var trandate        = nlapiStringToDate(invoice.getFieldValue('trandate'));
	var DocCerPago      = invoice.getFieldValue('custbody_cfdi_comp_elec_pago')||'';
	var FechaPago       = getDateFromDateSAT(trandate);
	var SelloPago       = '';
	var CertPago        = '';
	var CadPago         = '';
	var HoraPago        = '';
	
	if (DocCerPago != ''){
		var xmlobj      = nlapiLoadFile(DocCerPago);
		var xml         = xmlobj.getValue();
		var xmlDocument = nlapiStringToXML(xmlobj.getValue());
		var Comprobante     = nlapiSelectNodes(xmlDocument, "//*" );	
		var CertPago        = Comprobante[0].getAttribute('numeroCertificado')||'';
		if (CertPago){
			CertPago = encode64(CertPago);
		}
		var CadPago         = Comprobante[0].getAttribute('cadenaCDA')||'';
		if (CadPago != ''){
		    CadPago = CadPago.replace(/\|/g, "&#124;");
		}
		var SelloPago       = Comprobante[0].getAttribute('sello')||'';
		if (SelloPago){
			SelloPago = encode64(SelloPago);
		}
		var FechaPago       = Comprobante[0].getAttribute('FechaOperacion');
		var HoraPago        = Comprobante[0].getAttribute('Hora');
		FechaPago           = FechaPago+'T'+HoraPago;
		
		NumOperacion    = Comprobante[0].getAttribute('ClaveSPEI');
				
		var Ordenante       = nlapiSelectNodes(xmlDocument ,"//*[name()='Ordenante']" )||''; 
		if (Ordenante  != ''){
			RfcEmisorCtaOrd  = Ordenante[0].getAttribute('RFC');
			NomBancoOrdExt   = Ordenante[0].getAttribute('BancoEmisor');
			CtaOrdenante     = Ordenante[0].getAttribute('Cuenta');
			var monto        = Ordenante[0].getAttribute('MontoPago');
		}
		
		var Beneficiario    = nlapiSelectNodes(xmlDocument ,"//*[name()='Beneficiario']" ); 	
		if (Beneficiario  != ''){
			var BancoReceptor   = Beneficiario[0].getAttribute('BancoReceptor');
			CtaBeneficiario     = Beneficiario[0].getAttribute('Cuenta');
			RfcEmisorCtaBen     = Beneficiario[0].getAttribute('RFC');
		}
	}//if (DocCerPago != ''){
	
	if (moneda != 'MXN' && invoice.getFieldValue('exchangerate') == 1.00){
		var tipodecambio    = nsoParseFloatOrZero(nlapiExchangeRate(moneda, 'MXN')).toFixed(2);	
	}
	if (moneda == 'MXN'){tipodecambio = '';}
	
	var AllApply = SearchApply(invoice);
	
	for (var c = 1; c <= customer.getLineItemCount('addressbook'); c++){
  		var defaultbilling = (customer.getLineItemValue('addressbook', 'defaultbilling', c));
  		if (defaultbilling == 'T'){
			var codigopais    = (customer.getLineItemValue('addressbook', 'country', c));
			if (codigopais != 'MX'){
				var RfcEmisorCtaOrd = 'XEXX010101000';
			}
			break;
		}
	}
	var Monto = 0;
	for (var j=1; j<= invoice.getLineItemCount('apply'); j++){
		var apply = invoice.getLineItemValue('apply', 'apply', j)||'F';
		if (apply == 'T'){
			Monto += nsoParseFloatOrZero(invoice.getLineItemValue('apply', 'amount', j));
		}
	}//for (var j=1; j<= invoice.getLineItemCount('apply'); j++){
	
	if (Monto > 0){
		retval = '<fx:Complementos>';
		retval += '<fx:Pagos'
		retval += ' Version="'+  version  + '"';
		retval +='>';

		var paymentmethod   = invoice.getFieldValue('custbody_cfdi_metpago_sat');
				
		retval += '<fx:Pago'
		retval += ' FechaPago="'+  FechaPago  + '"';
		retval += ' FormaDePagoP="'+  MetPagoAlt(paymentmethod)  + '"';
		retval += ' MonedaP="'+  moneda  + '"';
		if (tipodecambio != ''){
			retval += ' TipoCambioP="'+  tipodecambio  + '"';
		}
		retval += ' Monto="'+   nsoParseFloatOrZero(Monto).toFixed(2)  + '"';
		if (NumOperacion != ''){
			retval += ' NumOperacion="'+  NumOperacion  + '"';
		}
		if (RfcEmisorCtaOrd != ''){
			retval += ' RfcEmisorCtaOrd="'+ RfcEmisorCtaOrd + '"';
		}
		if (NomBancoOrdExt != ''){
			NomBancoOrdExt = NomBancoOrdExt.replace(/\//g, '')
			retval += ' NomBancoOrdExt="'+  NomBancoOrdExt  + '"';
		}
		if (CtaOrdenante != ''){
			retval += ' CtaOrdenante="'+ CtaOrdenante   + '"';
		}
		if (RfcEmisorCtaBen !=''){
			retval += ' RfcEmisorCtaBen="'+ RfcEmisorCtaBen   + '"';
		}
		if (CtaBeneficiario != ''){
			retval += ' CtaBeneficiario="'+  CtaBeneficiario  + '"';
		}
		if(TipoCadPago != ''){
			retval += ' TipoCadPago="'+ TipoCadPago   + '"';
		}
		if(CertPago != ''){
			retval += ' CertPago="'+  CertPago  + '"';
		}
		if (CadPago != ''){
			retval += ' CadPago="'+  CadPago  + '"';
		}
		if(SelloPago != ''){
			retval += ' SelloPago="'+  SelloPago  + '"';
		}
		retval +='>';

		for (var i=1; i<= invoice.getLineItemCount('apply'); i++){
			var apply = invoice.getLineItemValue('apply', 'apply', i)||'F';
			if (apply == 'T'){
				var docid          = invoice.getLineItemValue('apply', 'doc', i)||'';
				for (var a = 0 ; AllApply != null && a < AllApply.length; a++){
					var iDdocref       = AllApply[a].getId()||'';
					if(iDdocref === docid){
						var ImpSaldoAnt    = nsoParseFloatOrZero(AllApply[a].getValue("fxamountpaid")).toFixed(2);
						var serie          = AllApply[a].getValue("tranid")||'';
						var Folio          = '';
						var ImpPagado      = nsoParseFloatOrZero(invoice.getLineItemValue('apply', 'amount', i)).toFixed(2) 
						var NumParcialidad = invoice.getFieldValue('custbody_cfdi_num_parcialidad')||'1';
						var totalDr        = nsoParseFloatOrZero(AllApply[a].getValue("fxamount")).toFixed(2);
						var docidUUID      = '';
						var MetodoDePagoDR = '';
						var MonedaDR       = '';
						var TipoCambioDR   = '';
						if (idcampoxml != ''){
							var cadenaxml = AllApply[a].getValue('custbody_cfdixml')||'';
								//cadenaxml = nlapiEscapeXML(cadenaxml);
								cadenaxml 		= cadenaxml.replace(/&/g, '&amp;');
							if (cadenaxml != ''){
								var xmlDocument = nlapiStringToXML(cadenaxml);
								var Complemento = nlapiSelectNodes(xmlDocument ,"//*[name()='tfd:TimbreFiscalDigital']" );   
								docidUUID       = Complemento[0].getAttribute('UUID');
								var Comprobante = nlapiSelectNodes(xmlDocument ,"//*[name()='cfdi:Comprobante']" )||''; 
								if(Comprobante != ''){
									var versionDr  = Comprobante[0].getAttribute('Version')||'3.2';
									MetodoDePagoDR = Comprobante[0].getAttribute('MetodoPago')||'';
									MetodoDePagoDR = MetodoDePagoDR == null || MetodoDePagoDR == "" ? Comprobante[0].getAttribute('formaDePago') : MetodoDePagoDR;
									if (versionDr == '3.2' && MetodoDePagoDR != ''){
										if(MetodoDePagoDR == 'PAGO EN UNA SOLA EXHIBICION'){MetodoDePagoDR = 'PUE'}
									}
									MonedaDR       = Comprobante[0].getAttribute('Moneda')||'';
									TipoCambioDR   = Comprobante[0].getAttribute('TipoCambio')||'';
								}//if(Comprobante != ''){
							}//if (cadenaxml != ''){
						}//if (idcampoxml != ''){

						if (MetodoDePagoDR == ''){
							MetodoDePagoDR = AllApply[a].getText("custbody_cfdi_formadepago")||'';
							if (MetodoDePagoDR != ''){
								var arrayPago  = new Array();
								var arrayPago  = MetodoDePagoDR.split('-');
								MetodoDePagoDR = arrayPago[0];
							}
						}//if (MetodoDePagoDR == ''){
						
						if (docidUUID == ''){
							docidUUID         = AllApply[a].getValue("custbody_uuid")||'';
						}//if (docidUUID == '')
						if (MonedaDR == ''){
							MonedaDR          = moneda;//AllApply[a].getValue("currencysymbol")||'';
						}//if (docidUUID == '')
						if (TipoCambioDR == ''){
							TipoCambioDR      = AllApply[a].getValue("exchangerate")||'';
						}//if (docidUUID == '')
			
						retval += '<fx:DoctoRelacionado';
						retval += ' IdDocumento="'+  docidUUID + '"';
						if(serie != ''){
							retval += ' Serie="'+  serie + '"';
						}
						if(Folio!= ''){
							retval += ' Folio="'+  Folio + '"';
						}
						retval += ' MonedaDR="'+  MonedaDR + '"';
						if((TipoCambioDR != '')&&(MonedaDR != moneda)){
							retval += ' TipoCambioDR="'+  TipoCambioDR + '"';
						}
						retval += ' MetodoDePagoDR="'+  MetodoDePagoDR + '"';
						if (MetodoDePagoDR == 'PPD'){
							retval += ' NumParcialidad="'+  NumParcialidad + '"';
							if (NumParcialidad == 1){
								ImpSaldoAnt = totalDr;
							}
							retval += ' ImpSaldoAnt="'+  nsoParseFloatOrZero(ImpSaldoAnt).toFixed(2) + '"';
						}//if (MetodoDePagoDR == 'PPD'){
						retval += ' ImpPagado="'+  nsoParseFloatOrZero(ImpPagado).toFixed(2) + '"';

						if (MetodoDePagoDR != 'PUE'){
							var ImpSaldoInsoluto   = nsoParseFloatOrZero(ImpSaldoAnt-ImpPagado).toFixed(2);
							retval += ' ImpSaldoInsoluto="'+  ImpSaldoInsoluto + '"';
						}
						retval +='/>';
					}//if(iDdocref === docid){
				}//for (var a = 0 ; AllApply != null && a <= AllApply.length; a++){
			}//if (apply == 'T'){
		}//for (var i=1; i<= invoice.getLineItemCount('apply'); i++){
		retval += '</fx:Pago>';
		retval += '</fx:Pagos>';
		retval += '</fx:Complementos>';
	}//if (Monto > 0){
	return retval;
}

function nlGetCFDiPagoEx(invoice, customer, params, setupcfdi)
{
	var testing         = setupcfdi.getFieldValue('custrecord_cfdi_testing');
	var retval = '';
	retval += '<fx:ComprobanteEx>';
	retval += '<fx:DatosDeNegocio>';
	var sucursalpagos = (setupcfdi.getFieldValue('custrecord_cfdi_suc_pagos') )|| params.getFieldValue('custrecord_cfdi_sucursal_mysuite');
	if (testing == 'T')
	{retval += '<fx:Sucursal>' + setupcfdi.getFieldValue('custrecord_cfdi_sucursal_testing') + '</fx:Sucursal>'; }
	else
	{retval += '<fx:Sucursal>' + sucursalpagos + '</fx:Sucursal>';}
	retval += '</fx:DatosDeNegocio>';
	retval += '</fx:ComprobanteEx>';
	retval += '</fx:FactDocMX>'; 
	return retval;
}

//functions

function getTipoDocumentoPago(recordtype) {
    var retval = '';

    switch (recordtype){
        
        case 'creditmemo':
            retval = 'NOTA_DE_CREDITO'
            break;
		case  'invoice':
			retval = 'FACTURA';
			break;
		case  'customerpayment':
			retval = 'PAGO';
			break;
		case  'customerdeposit':
			retval = 'DEPOSITO';
			break;
	}

    return retval;
}

function getDateFromDateSAT(strdate) 
{ 
	var retval = "";
	var date = (strdate);
  	retval += date.getFullYear() + '-' + fmtInt(date.getMonth()+1, 2) + '-' + fmtInt(date.getDate(), 2); 
  	retval += 'T' + fmtInt((date.getHours() + 2) % 24, 2) +':' + fmtInt(date.getMinutes(), 2) +':' + fmtInt(date.getSeconds(), 2); 
	return retval;
}

function fmtInt(number, digits)
{
	var wnumber = number.toString();
	if (wnumber.length < digits){
		for (var i = 1; i <= digits - number.toString().length; i++){
		wnumber = "0" + wnumber.toString();
		}
	}

	return wnumber;
}


function MetPagoAlt(idMetdPago)
{
	var retval = '';
	if(idMetdPago){
		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_cfdi_payment_met_nat', null, 'anyof', idMetdPago));
		   
		var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_cfdi_payment_met_sat'));

		var searchresult  = nlapiSearchRecord('customrecord_cfdi_metododepago', null, filters, columns);

		for(var i = 0 ; searchresult != null && i < searchresult.length; i++){
			var idMet          = searchresult[i].getText('custrecord_cfdi_payment_met_sat');
			if(idMet != null && idMet != ''){
				var arrayMP = new Array();
				arrayMP = idMet.split('-');
				if(arrayMP.length > 1){
					retval += arrayMP[0]+',';
				}
			}
		}
	}
	if(retval != null && retval != ''){
	retval = rtrimcoma(retval);
	}
	return retval;
}

function rtrimcoma(s) {
	
	var retval = "";
	
    // Quita los espacios en blanco del final de la cadena
	
	if(s != null && s != "")
	{
		var j = 0;
	
		// Busca el �ltimo caracter <> de un espacio
		for (var i = s.length - 1; i > -1; i--)
			if (s.substring(i, i + 1) != ',') {
			j = i;
			break;
		}
		
		retval = s.substring(0, j + 1);
	}
	
	return retval;
}

function MetPago(idMetdPago){
	var retval = '';
	if(idMetdPago){
		var filters = new Array();
		filters.push(new nlobjSearchFilter('custrecord_cfdi_payment_met_nat', null, 'anyof', idMetdPago));
		   
		var columns = new Array();
		columns.push(new nlobjSearchColumn('custrecord_cfdi_payment_met_sat'));

		var searchresult  = nlapiSearchRecord('customrecord_cfdi_metododepago', null, filters, columns);
		nlapiLogExecution('DEBUG','searchresult: ' + searchresult);
		for(var i = 0 ; searchresult != null && i < searchresult.length; i++){
			var idMet          = searchresult[i].getText('custrecord_cfdi_payment_met_sat');
			if(idMet != null && idMet != ''){
				var arrayMP = new Array();
				arrayMP = idMet.split('-');
				if(arrayMP.length > 1){
					retval = arrayMP[0];
				}
			}
		}
	}
	return retval;
}

function nsoParseFloatOrZero(f)
{
   var r=parseFloat(f);
   return isNaN(r) ? 0 : r;
}



function SearchApply(invoice){

	var idcampoxml    = nlapiGetContext().getSetting('SCRIPT','custscript_id_campo_xml')||'custbody_cfdixml';
	var searchresult  = '';
	var arrayIds      = new Array();
	var count         = 0;
	for (var j=1; j<= invoice.getLineItemCount('apply'); j++){
		var apply = invoice.getLineItemValue('apply', 'apply', j)||'F';
		if (apply == 'T'){
			arrayIds[count]     = invoice.getLineItemValue('apply', 'doc', j);
			count += 1;
		}
	}//for (var j=1; j<= invoice.getLineItemCount('apply'); j++){

	if (arrayIds.length >  0){
		var filters = new Array();
		filters.push(new nlobjSearchFilter("internalid", null, "anyof", arrayIds ));
		filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
		var columns = new Array();
		columns.push(new nlobjSearchColumn("tranid"));
		columns.push(new nlobjSearchColumn("fxamount"));
		//columns.push(new nlobjSearchColumn("currencysymbol"));
		columns.push(new nlobjSearchColumn("exchangerate"));
		columns.push(new nlobjSearchColumn(idcampoxml));
		columns.push(new nlobjSearchColumn("fxamountpaid"));
		columns.push(new nlobjSearchColumn("custbody_cfdi_formadepago"));
		columns.push(new nlobjSearchColumn("custbody_uuid"));

		searchresult  = nlapiSearchRecord('transaction', null, filters, columns);
	}
	return searchresult;
}

function GetRelacionados(invoice){
	
	var retval = new Array();
	var count  = 0;
	for (var x=1; x<= invoice.getLineItemCount('recmachcustrecord_cfdi_tabla_padre'); x++){
		var UUID = invoice.getLineItemValue('recmachcustrecord_cfdi_tabla_padre', 'custrecord_cfdi_rel_uuid', x)||'';
		if(UUID != ''){
			retval[count]= UUID;
			count +=1;
		}
	}
	return retval;
	
}