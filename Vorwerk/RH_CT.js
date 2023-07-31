/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jul 2016     sponce
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function RH_CT_FieldChanged(type, name, linenum)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(name == 'custrecord_fecha_contratacion')
		{
			var fecha_contratacion		= nlapiGetFieldValue('custrecord_fecha_contratacion');
				fecha_contratacion		= nlapiStringToDate(fecha_contratacion);
			var fecha_actual			= new Date();
			var diferencia				= duration(fecha_contratacion, fecha_actual);
			
			nlapiSetFieldValue('custrecord_antig_empresa', diferencia.años+' años '+diferencia.meses+' meses '+diferencia.dias+' días');	
		}
		if(name == 'custrecord_tipo_movimiento')
		{
			var tipo_mov				= returnBlank(nlapiGetFieldValue('custrecord_tipo_movimiento'));
			if(tipo_mov != '')
			{
				var puesto_actual		= nlapiGetFieldValue('custrecord_puesto_actual');
				nlapiSetFieldValue('custrecord_puesto_anterior',puesto_actual);
				nlapiSetFieldValue('custrecord_puesto_actual','');
				var hoy					= new Date();
				nlapiSetFieldValue('custrecord_fecha_de_aplicacion', hoy);
			}
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_CT(error, recordType, recordId);
    }
}

function duration(since, until) {

	//if first date is greater that the first, we fix the order
	if (since > until) {
		var temp = since;
		since = until;
		until = temp;
	}

	var years,months,days;
	
	//Years
	years = (until.getFullYear() - since.getFullYear());
	if (until.getMonth() == since.getMonth()){
		if (since.getDate() < (until.getDate()-1)) {
			years += 1;
		}
		if(since.getDate()==until.getDate()){
				years+= 1;
		}
	}
	if(since.getMonth() > until.getMonth()){
			years = (years - 1);
	}
	//Months
	if(since.getDate() > until.getDate()){
		if(since.getMonth() > (until.getMonth()-1)){
			months = 11 - (since.getMonth() - until.getMonth());
			if (since.getMonth() == until.getMonth()){
				months = 11;
			}
		}else{
			months = until.getMonth() - since.getMonth() - 1;
		}
	}else{
		if(since.getMonth() > until.getMonth()){
			months = 12 - (until.getMonth() - since.getMonth());
		}else{
			months = until.getMonth() - since.getMonth();
		}
	}
	//Days
	if(since.getDate() > (until.getDate()-1)){
		var days_pm = dayssInmonths(until.getMonth(until.getMonth()-1));
		days =  days_pm - since.getDate() + until.getDate();
		if((since.getMonth() == until.getMonth()) & (since.getDate()==until.getDate())){			
			days = 0;
		}
	}else{
		days = until.getDate() - since.getDate();
	}
	
	return ({"años":years,"meses":months,"dias":days});
}

function dayssInmonths(date){
	date = new Date(date);
	return 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
}
