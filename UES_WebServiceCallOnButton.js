// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
{
/*
   	Script Name:USE_WebServiceCallOnBtn
	Author:     Supriya	
	Company:    ProquestSolutions		
	Date:       4 nov 2011	
	Version:     1.0
	Description:To create button on form load and implement the functionality of web service call on button click

	Script Modification Log:
	-- Date --			-- Modified By --				--Requested By--				-- Description --
     5-11-2011            Mangesh                         sachin
     21-11-2011           Mangesh                         sachin
Below is a summary of the process controls enforced by this script file.  The control logic is described
more fully, below, in the appropriate function headers and code blocks.


     BEFORE LOAD
		- beforeLoadRecord(type)
     BEFORE SUBMIT
		- beforeSubmitRecord(type)
     AFTER SUBMIT
		- afterSubmitRecord(type)
     SUB-FUNCTIONS
		- The following sub-functions are called by the above core functions in order to maintain code
            modularization:             - NOT USED
*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================



// BEGIN GLOBAL VARIABLE BLOCK  =====================================
{
	//  Initialize any Global Variables, in particular, debugging variables...
}
// END GLOBAL VARIABLE BLOCK  =======================================



// BEGIN BEFORE LOAD ==================================================
function beforeLoadRecord(type,form)
{
		
			
			nlapiLogExecution('DEBUG', 'beforeLoadRecord', 'type=' + type);
			var InvoiceNo = nlapiGetFieldValue('tranid');
			nlapiLogExecution('DEBUG', 'Invoice No', InvoiceNo);
			
		// var recID=nlapiGetRecordId();
		   //  nlapiLogExecution('DEBUG','beforeLoadRecord','recID='+recID);
			
			 var recType=nlapiGetRecordType();
		     nlapiLogExecution('DEBUG','beforeLoadRecord','recType='+recType);
			//InvoiceNo=InvoiceNo+'#'+recType;
			 nlapiLogExecution('DEBUG','beforeLoadRecord','merge InvoiceNo='+InvoiceNo);
			form.setScript('customscript_xmlinvoiceuploadwscall');
			
			//var btnObj = form.addButton('custpage_websercallBtn', 'Factura Electrónica', 'BtnWebServiceCall(\'' + InvoiceNo + '\');');
			var btnObj = form.addButton('custpage_websercallBtn', 'Factura Electrónica', 'BtnWebServiceCall(\'' + InvoiceNo + '#' + recType+ '\');');
			
			  /// updated on 5/11/2011
			  // for this below logic Factura Electrónica button will show on only view mode.
			   if (type == 'create'||type == 'edit') 
				{
					var button = form.getButton('custpage_websercallBtn');
					nlapiLogExecution('DEBUG', 'create/edit type button', 'create/edit type button'+button);
					button.setDisabled(true);
					nlapiLogExecution('DEBUG', 'View Type ', 'i m in create / edit and type= :'+type);
					
				  
				}
				
				//this below code is used to when the field is blank the disabled the btn in view mode
				if(type=='view')
				{
					//var xml = nlapiGetFieldValue('custbody_xml_file')
					//nlapiLogExecution('DEBUG', 'Before load', 'xml file==', xml);
					//var pdf = nlapiGetFieldValue('custbody_pdf_file')
					//nlapiLogExecution('DEBUG', 'Before load', 'pdf file==', pdf);
                    var button1 = form.getButton('custpage_websercallBtn');
					nlapiLogExecution('DEBUG', 'view type button', 'view type button1'+button1);

                    var CodigodeRetorno= nlapiGetFieldValue('custbody_codigo_retorno')
					nlapiLogExecution('DEBUG', 'Before load', 'CodigodeRetorno==', CodigodeRetorno); 
					var DataXmlAsText = nlapiGetFieldValue('custbody_data_xml_as_text');
					nlapiLogExecution('DEBUG', 'Before load', 'DataXmlAsText==', DataXmlAsText);
					
					if(DataXmlAsText==null || DataXmlAsText=='' || DataXmlAsText==undefined)
					{
						button1.setDisabled(true);
						nlapiLogExecution('DEBUG', 'View Type ', 'i m in view and type= :'+type);
						
					}					
					else if(CodigodeRetorno==0)
					{
						
					    button1.setDisabled(true);
					    nlapiLogExecution('DEBUG', 'View Type ', 'i m in view and type= :'+type);
					
						
					}
					
				}//type==view
				
				
				
				
		
}

// END BEFORE LOAD ====================================================
