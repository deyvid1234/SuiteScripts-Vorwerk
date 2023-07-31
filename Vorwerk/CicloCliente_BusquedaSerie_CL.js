/** 
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       27 Mar 2017     jonathanvargas
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type) {
	if(type == 'create' || type =='edti'){
		NS.jQuery ('#submitter').parent().remove();
		NS.jQuery ('#_cancel').parent().remove();
		NS.jQuery ('#resetter').parent().remove();
		var serie = nlapiGetFieldValue ('custrecord_imr_serie');
		if(serie!=''){
			var txt = getFeedbackMessage('confirmation','Cliente Actualizado',"La serie "+ serie+ " a actualiado al cliente");
			NS.jQuery( ".uir-page-title-firstline" ).before(getFeedbackMessage('confirmation','Cliente Actualizado',"La serie "+ serie+ " a actualiado al cliente"));
			clientFieldChanged(null, 'custrecord_imr_serie', null);
		}
	}
	
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord() {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @param {String}
 *            name Field internal id
 * @param {Number}
 *            linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort
 *          value change
 */
function clientValidateField(type, name, linenum) {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @param {String}
 *            name Field internal id
 * @param {Number}
 *            linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum) {
	if(name == 'custrecord_imr_serie') {
		var seleccion = '';
		var serie = nlapiGetFieldValue ('custrecord_imr_serie') || '';
		nlapiRemoveSelectOption ('custpage_pedidos');
		nlapiInsertSelectOption ('custpage_pedidos', '', '', true);
		var data = {};
		if(serie != '') {
			var serieSearch = nlapiSearchRecord ('salesorder', 'customsearch664', new nlobjSearchFilter ('serialnumber', null, 'is', serie), 
							[new nlobjSearchColumn ('custentity_cliente_registrado_trp', 'customer'),
							new nlobjSearchColumn ('email', 'customer'),
							new nlobjSearchColumn ('address', 'customer'),
							new nlobjSearchColumn ('mobilephone', 'customer'),
							new nlobjSearchColumn ('phone', 'customer')]) || new function() {
				alert ('Serie '+nlapiGetFieldValue ('custrecord_imr_serie')+', No encontrada');
				return [];
			};
			for(var i = 0; i < serieSearch.length; i++) {
				var transaction = serieSearch[i];
				var internalid = transaction.getId ();
				var trandate = transaction.getValue ('trandate') || '';
				var tranid = transaction.getValue ('tranid') || '';
				var selected = serieSearch.length == 1 ? true : false;
				nlapiInsertSelectOption ('custpage_pedidos', internalid, tranid + ' - ' + trandate, selected);
				seleccion = selected ? internalid : '';
				var id = transaction.getValue ('serialnumber') || '';
				var entityId = transaction.getValue ('entityid', 'contactPrimary') || '';
				var factura = transaction.getText ('billingtransaction') || '';
				var fechfac = transaction.getValue ('trandate', 'billingTransaction') || '';
				var lider = transaction.getText ('supervisor', 'salesRep') || '';
				var prese = transaction.getText ('salesrep') || '';
				var geren = transaction.getText ('custentity_gervta') || '';
				var conta = transaction.getText ('entityid', 'contactPrimary') || '';
				var plataforma = transaction.getValue ('custentity_cliente_registrado_trp', 'customer') || '';
				var correo = '';
				var dir = '';
				var tel = '';
				if(conta != '') {
					correo = transaction.getValue ('email', 'contactPrimary') || '';
					dir = transaction.getValue ('address', 'contactPrimary') || '';
					tel = transaction.getValue ('phone', 'contactPrimary') || '';
				}
				else if(conta == '') {
					conta = transaction.getText ('custbodycontacto1') || '';
					entityId = transaction.getValue ('custbodycontacto1') || '';
					if(conta != '') {
						correo = transaction.getValue ('custbodycontacto3') || '';
						dir = transaction.getValue ('custbodycontacto2') || '';
						tel = transaction.getValue ('custbodycontacto4') || '';
					}
					else {
						conta = transaction.getText ('entity') || '';
						entityId = transaction.getValue ('entity') || '';
						correo = transaction.getValue ('email', 'customer') || '';
						dir = transaction.getValue ('address', 'customer') || '';
						tel = transaction.getValue ('phone', 'customer') || transaction.getValue ('mobilephone', 'customer')||'' ;
					}
				}
				data[internalid] = ({
				    trandate : trandate,
				    tranid : tranid,
				    id : id,
				    entityId : entityId,
				    factura : factura,
				    fechfac : fechfac,
				    lider : lider,
				    prese : prese,
				    geren : geren,
				    conta : conta,
				    plataforma : plataforma,
				    correo : correo,
				    dir : dir,
				    tel : tel,
				    conta : conta });
			} // end for
			if(seleccion != '') {
				setDefaultValues (data[seleccion]);
			}
			data = JSON.stringify (data);
			nlapiSetFieldValue ('custpage_jsonfield', data);
			
		}
	}
	else if(name == 'custpage_pedidos') {
		var seleccion = nlapiGetFieldValue ('custpage_pedidos') || '';
		var data = nlapiGetFieldValue ('custpage_jsonfield') || '';
		var partida = '';
		if(seleccion != '' && data != '') {
			data = JSON.parse (data);
			partida = data[seleccion];
		}
		setDefaultValues (partida);
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @param {String}
 *            name Field internal id
 * @returns {Void}
 */
function clientPostSourcing(type, name) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @returns {Void}
 */
function clientLineInit(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function clientValidateLine(type) {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @returns {Void}
 */
function clientRecalc(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @returns {Boolean} True to continue line item insert, false to abort insert
 */
function clientValidateInsert(type) {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 */
function clientValidateDelete(type) {
	
	return true;
}

function setDefaultValues(partida) {
	nlapiSetFieldValue ('custrecord_imr_identificador', partida.id || '');
	nlapiSetFieldValue ('custrecord_imr_factura', partida.factura || '');
	nlapiSetFieldValue ('custrecord_imr_fechafactura', partida.fechfac || '');
	nlapiSetFieldValue ('custrecord_imr_telcontacto', partida.tel || '');
	nlapiSetFieldValue ('custrecord_imr_mailcontact', partida.correo || '');
	nlapiSetFieldValue ('custrecord_imr_dircontacto', partida.dir || '');
	nlapiSetFieldValue ('custrecord_imr_contacto', partida.conta || '');
	nlapiSetFieldValue ('custrecord_imr_liderequipo', partida.lider || '');
	nlapiSetFieldValue ('custrecord_imr_presentadora', partida.prese || '');
	nlapiSetFieldValue ('custrecord_imr_gerente', partida.geren || '');
	nlapiSetFieldValue ('custrecord_cc_se_registro_plataforama_re', partida.plataforma || 'F');
	
	var entityFields = nlapiLookupField ('customer', partida.entityId, ['custentity_imr_vta','custentity_imr_fventa',
	                                                           'custentity_imr_entregado','custentity_imr_fentrega','custentity_imr_contactoent',
	                                                           'custentity_imr_cteent','custentity_imr_ctefent','custentity_imr_ctecent',
	                                                           'custentity_imr_invclasec','custentity_imr_feclasec','custentity_imr_contactocc',
	                                                           'custentity_imr_asistccocina','custentity_imr_feclasec','custentity_imr_contactocc',
	                                                           'custentity_imr_spostvta','custentity_imr_f1seguimiento','custentity_imr_contacto1s',
	                                                           'custentity_imr_svisita','custentity_imr_f2visita','custentity_imr_contacto2v',
	                                                           'custentity_imr_propreclut','custentity_imr_fpreclutamiento','custentity_imr_contactopr',
	                                                           'custentity_imr_encuesta','custentity_imr_fencuestas','custentity_imr_contactoes',])||'';
	var count = nlapiGetLineItemCount ('custpage_datos');
	if(count > 0){
		for(var i = count; i > 0; i--) {
	        nlapiRemoveLineItem ('custpage_datos', i);
        }
	}
	var line=0;
	if(entityFields != '') {
		if(entityFields.custentity_imr_vta == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'Venta');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_fventa);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado', 'T');
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_entregado == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'Salida de TM');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_fentrega);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado', 'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contactoent);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_cteent == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'Entrega TM a Cliente');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_ctefent);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_ctecent);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_invclasec == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'INVITACIÓN CLASE COCINA');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_feclasec);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contactocc);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_asistccocina == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'ASISTENCIA CLASE COCINA');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_feclasec);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contactocc);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_spostvta == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'SEGUIMIENTO POS-VENTA');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_f1seguimiento);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contacto1s);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_svisita == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  '2A. VISITA');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_f2visita);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contacto2v);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_propreclut == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'PROPUESTA RECLUTAMIENTO');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_fpreclutamiento);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contactopr);
			nlapiCommitLineItem ('custpage_datos');
		}
		if(entityFields.custentity_imr_encuesta == 'T') {
			line++;
			nlapiSelectNewLineItem ('custpage_datos')
			nlapiSetCurrentLineItemValue ('custpage_datos', 'texto',  'ENCUESTA DE SATISFACCIÓN');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'fecha',  entityFields.custentity_imr_fencuestas);
			nlapiSetCurrentLineItemValue ('custpage_datos', 'aplicado',  'T');
			nlapiSetCurrentLineItemValue ('custpage_datos', 'contacto', entityFields.custentity_imr_contactoes);
			nlapiCommitLineItem ('custpage_datos');
		}
	}
	if(nlapiGetFieldValue ('custpage_pedidos')!='' && nlapiGetFieldValue ('custpage_update')!= nlapiGetFieldValue ('custrecord_imr_serie')){
		guardarDatosCliente(partida);
	}
		
}


function guardarDatosCliente(partida) {
	var tipo = parseInt (nlapiGetFieldValue ('custrecord_imr_tipociclo')) || 0;
	var serie = nlapiGetFieldValue ('custrecord_imr_serie') || '';
	var custrecord_imr_fecha = nlapiGetFieldValue ('custrecord_imr_fecha') || '';
	var seRegistroPlataforma = nlapiGetFieldValue ('custrecord_cc_se_registro_plataforama_re') || 'F';
	if(partida != '' && tipo != 0) {
		var fields = [];
		var values = [];
		if(seRegistroPlataforma =='T'){
			values.push (seRegistroPlataforma);
			fields.push ('custentity_cliente_registrado_trp');
		}			
		values.push ('T');
		values.push (custrecord_imr_fecha);
		values.push (partida.conta);
		if(tipo == 3) {
			fields.push ('custentity_imr_spostvta');
			fields.push ('custentity_imr_f1seguimiento');
			fields.push ('custentity_imr_contacto1s');
		}
		else if(tipo == 4) {
			fields.push ('custentity_imr_asistccocina');
			fields.push ('custentity_imr_feclasec');
			fields.push ('custentity_imr_contactocc');
		}
		else if(tipo == 5) {
			fields.push ('custentity_imr_svisita');
			fields.push ('custentity_imr_f2visita');
			fields.push ('custentity_imr_contacto2v');
		}
		else if(tipo == 6) {
			fields.push ('custentity_imr_propreclut');
			fields.push ('custentity_imr_fpreclutamiento');
			fields.push ('custentity_imr_contactopr');
		}
		else if(tipo == 7) {
			fields.push ('custentity_imr_encuesta');
			fields.push ('custentity_imr_fencuestas');
			fields.push ('custentity_imr_contactoes');
		}
		else if(tipo == 8) {
			fields.push ('custentity_imr_cteent');
			fields.push ('custentity_imr_ctefent');
			fields.push ('custentity_imr_ctecent');
		}
		nlapiSubmitField ('customer', partida.entityId, fields,values);
		var url = nlapiResolveURL ('RECORD', 'customrecord_imr_regciclocte', null, true);
		url +="&custrecord_imr_serie="+serie+"&custrecord_imr_tipociclo="+tipo;
		setWindowChanged (window, false);
		window.location.href = url;		
	}// end if data tipo
}