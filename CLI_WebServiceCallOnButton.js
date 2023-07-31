// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
{
/*
   	Script Name:
	Author:   Supriya
	Company:  ProquestSolutions
	Date:     4 nov 2011
	Version:  1.1
	Description:to call web service on button click.


	Script Modification Log:

	-- Date --			-- Modified By --				--Requested By--				-- Description --
     5-11-2011             Mangesh                         sachin
     21-11-2011            Mangesh                         sachin


	Below is a summary of the process controls enforced by this script file.  The control logic is described
	more fully, below, in the appropriate function headers and code blocks.

     PAGE INIT
		- pageInit(type)


     SAVE RECORD
		- saveRecord()


     VALIDATE FIELD
		- validateField(type, name, linenum)


     FIELD CHANGED
		- fieldChanged(type, name, linenum)


     POST SOURCING
		- postSourcing(type, name)


	LINE INIT
		- lineInit(type)


     VALIDATE LINE
		- validateLine()


     RECALC
		- reCalc()


     SUB-FUNCTIONS
		- The following sub-functions are called by the above core functions in order to maintain code
            modularization:





*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================



// BEGIN SCRIPT UPDATION BLOCK  ====================================
/*


*/
// END SCRIPT UPDATION BLOCK  ====================================


// BEGIN GLOBAL VARIABLE BLOCK  =====================================
{

	//  Initialize any Global Variables, in particular, debugging variables...
}
// END GLOBAL VARIABLE BLOCK  =======================================


// BEGIN FUNCTION ===================================================
function BtnWebServiceCall(values)
{ 
    var intID_RecType=new Array();
	
    intID_RecType=values.toString().split("#");
	//alert("InvoiceNo="+intID_RecType[0]);
	//alert("recType="+intID_RecType[1]);
	
	if(intID_RecType[0]!=null && intID_RecType[1]=='invoice')
	{
		//alert('i m in invoice url');
	    ///InvoiceNos== Input From Invoice Record On click Button 
	    // var urlCapture='http://189.203.215.6/InvoiceWS/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?invoiceNo='+InvoiceNo
	    // var urlCapture='http://serverIpAddress/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
	 
	  //demo account link
	  // var urlCapture='http://14.97.7.248:8080/Invoice/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
	 
	  // live account limk
	  var urlCapture='http://189.203.215.6/InvoiceWS/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
	 //alert('invoice url='+urlCapture);
	
	}
	else if(intID_RecType[0]!=null && intID_RecType[1]=='creditmemo')
	{
			//alert('i m in creditmemo url');
			//var urlCapture='http://serverIpAddress/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
			 //demo account link
			//var urlCapture='http://14.97.7.248:8080/Invoice/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
			
			// live account limk
			var urlCapture='http://189.203.215.6/InvoiceWS/InvoiceUploader.asmx/CreateAndUploadInvoiceXML?recordNo='+intID_RecType[0]+'&recType='+intID_RecType[1];
			//alert('creditmemo url='+urlCapture);
	}
	
	//alert(urlCapture);
	/////Url Call API 
    //var urlStatus = nlapiRequestURL(urlCapture, null,null, null);
	
	var urlStatus = nlapiRequestURL(urlCapture, null, null, handleResponse);
 
	 function handleResponse(response) 
	 {
	 //Do nothing
	 return;
	 }
	
	//alert(urlStatus.getCode());
	
}



// END FUNCTION =====================================================


