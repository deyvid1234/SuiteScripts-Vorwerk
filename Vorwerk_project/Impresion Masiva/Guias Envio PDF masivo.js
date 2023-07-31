function Orden_Venta_PDF(request,response) 
{	
	try{
		var Base64		= new MainBase64();
		var data 		= request.getParameter('data');
			data	   	= Base64.decode(data);
			data		= JSON.parse(data);
		var recordType 	= returnBlank(data.recordType);	
		var recordId 	= returnBlank(data.recordId);	
		var host 		= returnBlank(data.host);
		var titleForm	= 'Orden de Venta';
		var primer      = true
		nlapiLogExecution( 'DEBUG', 'recordId',recordId);
		var recordIds = recordId.toString()
		var ids = recordIds.split(',');
		nlapiLogExecution( 'DEBUG', 'ids',ids);
		nlapiLogExecution( 'DEBUG', 'ids.length',ids.length);
		var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
			for(i in ids){
				nlapiLogExecution( 'DEBUG', 'ids[]',ids[i]);
				recordId = ids[i]
			
						
				if(primer){
					nlapiLogExecution( 'DEBUG', 'primer');
					xml += "<pdfset>";
					primer = false
				}
				   
				  var pdf_fileURL = nlapiEscapeXML(recordId); 

				  xml += "<pdf src='"+ pdf_fileURL +"'/>";		
			}
		xml += "</pdfset>";
		var file 		= nlapiXMLToPDF( xml );
		var fileName	= 'GuiasDeEnvio.pdf';
		response.setContentType('PDF',fileName, 'inline');
		response.write(file.getValue());

	}catch(e){

	}		
}