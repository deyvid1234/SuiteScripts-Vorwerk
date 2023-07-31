define([],

function() {

    return {
    	createXMLJDG: function(){
    		
    		try{
    			var xml = "";
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
    					xml += strName;
    				xml += "</body>\n";
    			xml += "</pdf>";
    			
    			var file = render.xmlToPdf({
		    		xmlString: xml
	 			});
    			
    		}catch(err){
    			log.debug("err Create xml JDG",err);
    		}
    	}
    	
    };
    
});
