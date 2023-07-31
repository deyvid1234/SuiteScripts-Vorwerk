/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       18 Jan 2017     jonathanvargas
 *
 */

/**
 * 
 */
function beforeLoad(type, form, request) {
	if(type == 'create' || type == 'edit') {
		/*var result = new Object ();
		var callback = function(info, result) {
			var internalid = info.getValue ('inventorynumber');
			result[internalid] = result[internalid] || new Array ();
			result[internalid].push (1);
		}
		result = getfullResutSearch (nlapiLoadSearch ('inventorynumber', 'customsearch_incidencia_series'), result, callback);*/
		//var jsontext = JSON.stringify (result);
		//var field = form.addField ('custpage_series_siniestradas', 'longtext', 'siniestradas')
		//field.setDisplayType ('hidden');
		//field.setDefaultValue (jsontext);
	}
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */

var seriesMalas = new Object ();
function clientPageInit(type) {
	try {
		var result = new Object ();
		/*var callback = function(info, result) {
			var internalid = info.getValue ('inventorynumber');
			result[internalid] = result[internalid] || new Array ();
			result[internalid].push (1);
		}
		result = getfullResutSearch (nlapiLoadSearch ('inventorynumber', 'customsearch_incidencia_series'), result, callback);*/
      
      var callback = function(info, result) {
          var internalid = info.getValue ('custrecord_serial_mala');
          result[internalid] = '*'
      }
      result = getfullResutSearch (nlapiLoadSearch('customrecord_seriales_malas', 'customsearch_seriales_malas'), result, callback);

		//var series = nlapiGetFieldValue ('custpage_series_siniestradas');
		seriesMalas = result;
      console.log(seriesMalas);
	}
	catch(e) {
		
	}
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord() {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Boolean} True to continue changing field value, false to abort value change
 */
function clientValidateField(type, name, linenum) {
   	console.log(name);
	if(name == 'custbody_numero_serie') {
		var serie = nlapiGetFieldValue ('custbody_numero_serie')||'';
		console.log(serie);
		if(serie != '' &&seriesMalas[serie] != null) {
			alert ('Esta serie tiene una dudosa procedencia, se encuentra dentro del listado de incidencias y no se puede usar\nAvisar inmediatamente a Dirección de Logística y Finanzas');
			nlapiSetFieldValue ('custbody_numero_serie', '');
			return false;
		}
		else if(serie != ''){
			//var serieProhibida = nlapiSearchRecord ('inventorynumber', 'customsearch_incidencia_series',new nlobjSearchFilter ('inventorynumber', null, 'is', serie))||'';
         	var serieProhibida = nlapiSearchRecord ('customrecord_seriales_malas', 'customsearch_seriales_malas',new nlobjSearchFilter ('custrecord_serial_mala', null, 'is', serie))||'';
			if(serieProhibida != ''){
				alert ('Esta serie tiene una dudosa procedencia, se encuentra dentro del listado de incidencias y no se puede usar\nAvisar inmediatamente a Dirección de Logística y Finanzas');
				nlapiSetFieldValue ('custbody_numero_serie', '');
				return false;
			}
			
		}
	}
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function clientFieldChanged(type, name, linenum) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @returns {Void}
 */
function clientPostSourcing(type, name) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function clientLineInit(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function clientValidateLine(type) {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @returns {Void}
 */
function clientRecalc(type) {
	
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item insert, false to abort insert
 */
function clientValidateInsert(type) {
	
	return true;
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord opportunity
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to continue line item delete, false to abort delete
 */
function clientValidateDelete(type) {
	
	return true;
}

/**
 * Ejecuta una busqueda cuando sean mas de 1000 registros y los ordena dependiendo del callback
 * 
 * @param {nlobjSearch} Busqueda a ejecutar
 * @param {Object} Objecto en la que se guardara la información
 * @param {function} metodo con el cual se guardara la informacion en el objecto
 * @param {nlobjSearchFilter|Array} filtros extra que se decee agregar
 * @param {nlobjSearchColumn|Array} columnas extra que se decee agregar
 * @returns {Object} Object con los resultados de la busqueda
 * */

function getfullResutSearch(search, result, callback, filters, columns) {
	if(filters) {
		filters = filters.length ? filters : [ filters ];
		search.addFilters (filters)
	}
	if(columns) {
		columns = columns.length ? columns : [ columns ];
		search.addColumns (columns);
	}
	var searchResults = search.runSearch ();
	var resultIndex = 0;
	var resultStep = 1000;
	var resultSet = new Object ();
	do {
		resultSet = returnBlank (searchResults.getResults (resultIndex, resultIndex + resultStep));
		resultIndex = resultIndex + resultStep;
		for(i = 0; i < resultSet.length; i++) {
			callback (resultSet[i], result);
		}
	}while(resultSet.length > 0);
	return result;
}
