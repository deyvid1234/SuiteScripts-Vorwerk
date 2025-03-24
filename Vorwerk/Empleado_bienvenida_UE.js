/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       21 Sep 2016     IMR
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function Empleado_bienvenida_UE_BefortSubmit(type){
	var recordId	= nlapiGetRecordId();
	var recordType	= nlapiGetRecordType()
	try{
          try{
             var preferences			= nlapiLoadConfiguration('companypreferences');
             var remitente			= preferences.getFieldValue('custscript_remotente_mailing_recluta');
             }catch(error){
             }
		  var active	= nlapiGetFieldValue('isinactive');
		  var send		= false;
		  if(recordId){
		  var columns	= [new nlobjSearchColumn('isinactive')];
		  var filters	= [new nlobjSearchFilter('internalid', null, 'is', recordId)];
		  var result	= nlapiSearchRecord(recordType, null, filters, columns);
		  if(result){
			  if(active != 'T' && result[0].getValue('isinactive') == 'T'){
				  send	= true;
			  }
		  }
		  }else if(active != 'T'){
			  send		= true;
		  }
		  if(send){
			  var promocion					= nlapiGetFieldValue('employeetype');
			  var fecha_contratacion		= nlapiGetFieldValue('hiredate');
			  fecha_contratacion			= nlapiStringToDate(fecha_contratacion);
			  var fecha_contratacion_filtro	= fecha_contratacion;
			  fecha_contratacion_filtro			= fecha_contratacion_filtro.getDate()+'/'+ (fecha_contratacion_filtro.getMonth()+1)+'/'+fecha_contratacion_filtro.getFullYear();
			  var filters	= [new nlobjSearchFilter('formulanumeric', null, 'equalto', 1)];
			  filters[0].setFormula("CASE WHEN TO_DATE({startdate})<=TO_DATE('"+fecha_contratacion_filtro+"','DD/MM/YYYY') AND TO_DATE({enddate})>=TO_DATE('"+fecha_contratacion_filtro+"','DD/MM/YYYY') THEN 1 ELSE 0 END");
			  var columns	= [new nlobjSearchColumn('custrecord5'),
			             	   new nlobjSearchColumn('custrecord6'),
			             	   new nlobjSearchColumn('custrecord7'),
			             	   new nlobjSearchColumn('custrecord8'),
			             	   new nlobjSearchColumn('custrecord_promocion_default')];
			  var result		= nlapiSearchRecord('promotioncode', null, filters, columns)||new Array();;
			  var promoDefault		= null;
			  var promocionAsignada	= null;
			  for(var i=0;i<result.length;i++){
				  if(result[i].getValue('custrecord_promocion_default')=='T'){
					  promoDefault	= result[i];
				  }else{
					  promocionAsignada	= result[i];;
				  }
			  }
			  if(!promocionAsignada){
				  promocionAsignada	= promoDefault;
			  }
			  
			  if(promocion == 1 && promocionAsignada){
				  var meses			= promocionAsignada.getValue('custrecord5');
				  var dias_obj1		= promocionAsignada.getValue('custrecord6');
				  var dias_obj2		= promocionAsignada.getValue('custrecord7');
				  var dias_obj3		= promocionAsignada.getValue('custrecord8');
				  var fecha1		= nlapiDateToString(nlapiAddDays(fecha_contratacion, dias_obj1));
				  var fecha2		= '';
				  var fecha3		= '';
				  var display2		= 'none';
				  var display3		= 'none';
				  if(meses>=2){
					  fecha2		= nlapiDateToString(nlapiAddDays(fecha_contratacion, dias_obj2));
					  display2		= 'block';
				  }
				  
				  if(meses>=3){
					  fecha3		= nlapiDateToString(nlapiAddDays(fecha_contratacion, dias_obj3));
					  display3		= 'block';  
				  }
				  var emailMerge	= nlapiCreateEmailMerger(32);
				  emailMerge.setEntity("employee", recordId);
				  var merger		= emailMerge.merge();
				  var body			= merger.getBody();
				  var subject		= merger.getSubject();
				  /*body				= body.replace('custpantilla_display2',display2);
				  body				= body.replace('custpantilla_display3',display3);
				  body				= body.replace('custpantilla_fecha1',fecha1);
				  body				= body.replace('custpantilla_fecha2',fecha2);
				  body				= body.replace('custpantilla_fecha3',fecha3);*/
				  nlapiSendEmail(remitente||20003, recordId, subject, body,null); 
			  }
		  }
	}catch(error){
		Generic_HE_Catch_SS(error,recordType,recordId);
	}
}
