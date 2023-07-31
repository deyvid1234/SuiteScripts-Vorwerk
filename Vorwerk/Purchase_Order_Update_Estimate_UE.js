/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Nov 2016     IMR
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function Purchase_Order_Update_Estimate_UE_BeforeLoad(type, form, request){
 
}

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function Purchase_Order_Update_Estimate_UE_BeforeSubmit(type){
	  var recordId		= nlapiGetRecordId();
	  var recordType	= nlapiGetRecordType();
	  try{
		  if(type == 'delete'){
			  updateRequisicion();
		  }
	  }catch(error){
		  Generic_HE_Catch_SS(error,recordType,recordId);
	  }
}

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
function Purchase_Order_Update_Estimate_UE_AfterSubmit(type){
  var recordId		= nlapiGetRecordId();
  var recordType	= nlapiGetRecordType();
  try{
	  if(type != 'delete'){
		  updateRequisicion();
	  }
  }catch(error){
	  Generic_HE_Catch_SS(error,recordType,recordId);
  }
}


function updateRequisicion(){
	 var countitem				= nlapiGetLineItemCount("item");
	  var requisicionArray		= new Array();
	  for(var i=1;i<=countitem;i++){
		  var requisicion	= nlapiGetLineItemValue("item", "custcol_creatred_from_po", i);
		  if(requisicion && requisicionArray.indexOf(requisicion)==-1){
			  requisicionArray.push(requisicion);
		  }
	  }
	  if(requisicionArray.length>0){
			var params	= new Array();
			params["custscript_json_data_purchase_order"]	= JSON.stringify({data:requisicionArray});
			var status	= nlapiScheduleScript("customscript_update_rq_po_sd", "customdeploy_update_rq_po_sd", params);
	  }
}