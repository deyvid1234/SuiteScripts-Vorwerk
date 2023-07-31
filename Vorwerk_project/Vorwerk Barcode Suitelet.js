/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// This sample shows how to render search results into a PDF file.
// Note that this sample is a Suitelet, so it cannot be run in the debugger.
define(['N/email','N/record','N/render', 'N/search','N/xml','N/config','N/file','N/url','./Vorwerk Utils.js','./Vorwerk Dictionary Script.js'],
    function(email,record,render,search,xml,config,file,url,Utils,Dictionary) {

		//creacion del pdf
        function cretePDF(context){
        	try{
        		var params = JSON.parse(context.request.body);
        		log.debug('params',params)
                // ConfigDetails
                var xml= "";
                xml  = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
        		xml += "<pdf>";
        			xml += "<head>";
        				xml += "<macrolist>";
        					xml += "<macro id=\"paginas\">";
        						xml += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"right\">Página <pagenumber/> de <totalpages/></p>";
        					xml += "</macro>";
        				xml += "</macrolist>";
        			xml += "</head>";
        			xml += "<body font='helvetica' font-size='6' footer=\"paginas\" footer-height='2'>";
        			xml += "<table width='670px'>";
        			xml += "<tr>";
        			xml += "<td><barcode codetype='code128' value='"+params+"' showtext='true'/></td>";
        			xml += "</tr></table>";
        			xml += "</body>\n";
        		xml += "</pdf>";
        		var filex = render.xmlToPdf({
    	    					xmlString: xml
    			 			});	
    			 var renderer = render.create();
    			 renderer.templateContent = filex.getContents();
    			 var my_file = file.create({
    	                name: params+'.pdf',
    	                fileType: file.Type.PDF,
    	                contents: renderer.templateContent,
    	                folder: 384957
    	            });
    	            var fileid = my_file.save();
    	            log.debug('fileid',fileid)
    	            context.response.write(JSON.stringify({id:fileid}));
    			 return true;
        	}catch(err){
        		log.error("err CreatePDF",err)
        	}
            
        }

   

        function onRequest(context){
            try{
                log.debug('context.request.method',context.request.method);
                if (context.request.method == 'POST'){
                	 log.debug('context',context);
                	cretePDF(context);
                }
                log.debug('context.request.method',context.request.method);
                if (context.request.method == 'GET'){
                    try{
                        var request = context.request;
                          log.debug("LogUser",request);
                            var idfile = request.parameters.idfile;
                            log.debug("idfile",idfile);
                            
                            var objXlsFile = file.load({
                                id : idfile
                            });
                            
                            log.debug("objXlsFile",objXlsFile);
                            context.response.writeFile(objXlsFile); 
                      }catch(err){
                        log.error("error getFile",err);
                      }
                }
//                return true;
            }
            catch(e){
                log.error('There is an error in onRequest',e)
            }
        }
        return {
            onRequest: onRequest
        };
        
    });