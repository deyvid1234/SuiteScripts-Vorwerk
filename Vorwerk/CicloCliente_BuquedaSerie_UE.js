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
 *            type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm}
 *            form Current form
 * @param {nlobjRequest}
 *            request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request) {
	if(type == 'edit' || type == 'create') {
		var updateField = form.addField ('custpage_update', 'text', 'Actualizado');
		updateField.setDisplayType ('hidden');
		if(type == 'create') {
			try {
				form.getButton ("resetter").setVisible (false);
				form.getButton ("submitter").setVisible (false);
				form.getButton ("submitcopy").setVisible (false);
				form.getButton ("submitnew").setVisible (false);
			}
			catch(e) {
				
			}
		}
		var custrecord_imr_serie = request.getParameter ('custrecord_imr_serie') || '';
		if(custrecord_imr_serie != '') {
			nlapiSetFieldValue ('custrecord_imr_serie', custrecord_imr_serie);
			nlapiSetFieldValue ('custpage_update', custrecord_imr_serie);
			
		}
		var custrecord_imr_tipociclo = request.getParameter ('custrecord_imr_tipociclo') || '';
		if(custrecord_imr_tipociclo != '') {
			nlapiSetFieldValue ('custrecord_imr_tipociclo', custrecord_imr_tipociclo);
		}
		var jsonField = form.addField ('custpage_jsonfield', 'textarea', 'JSON');
		jsonField.setDisplayType ('hidden');
		var options = form.addField ('custpage_pedidos', 'select', 'Pedidos Relacionados');
		form.insertField (options, 'custrecord_cc_se_registro_plataforama_re');
		var serie = request.getParameter ('custrecord_imr_serie') || '';
		form.getField ('custrecord_imr_serie', serie).setDefaultValue (serie);
		
		var sublist = form.addSubList ('custpage_datos', 'inlineeditor', 'Datos Cliente');
		sublist.setDisplayType ('disabled');
		sublist.addField ('texto', 'text', 'ciclo');
		sublist.addField ('fecha', 'text', 'fecha');
		sublist.addField ('aplicado', 'checkbox', 'Aplicado');
		sublist.addField ('contacto', 'text', 'Contacto');
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit approve, reject,
 *            cancel (SO, ER, Time Bill, PO & RMA only) pack, ship (IF)
 *            markcomplete (Call, Task) reassign (Case) editforecast (Opp,
 *            Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your
 * script deployment.
 * 
 * @appliedtorecord customrecord_imr_regciclocte
 * 
 * @param {String}
 *            type Operation types: create, edit, delete, xedit, approve,
 *            cancel, reject (SO, ER, Time Bill, PO & RMA only) pack, ship (IF
 *            only) dropship, specialorder, orderitems (PO only) paybills
 *            (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type) {
	if(type == 'edit' || type == 'create') {
		var tipo = parseInt (nlapiGetFieldValue ('custrecord_imr_tipociclo')) || 0;
		var seleccion = nlapiGetFieldValue ('custpage_pedidos') || '';
		var custrecord_imr_fecha = nlapiGetFieldValue ('custrecord_imr_fecha') || '';
		var data = nlapiGetFieldValue ('custpage_jsonfield') || '';
		var seRegistroPlataforma = nlapiGetFieldValue ('custrecord_cc_se_registro_plataforama_re') || 'F';
		var partida = '';
		if(seleccion != '' && data != '') {
			data = JSON.parse (data);
			partida = data[seleccion];
		}
		if(data != '' && tipo != 0) {
			var fields = [];
			var values = [];
			if(seRegistroPlataforma == 'T') {
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
			nlapiSubmitField ('customer', partida.entityId, fields, values);
		}// end if data tipo
	}// end if type
}
