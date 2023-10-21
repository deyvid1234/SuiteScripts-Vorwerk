/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render','N/email','N/file','N/record','N/search','N/format','N/runtime'],

function(render,email,file,record,search,format,runtime) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
    	try{
    		var method = context.request.method;
    		var params = context.request.parameters;
    		var recordid = 4725581//recordid = parseInt(params.receiptID);
    		log.debug('method',method);
    		
	         
	        var idTpl = 273;
	        //var sendEmail = params.emailSend;
	       // log.debug('params',params);
	        //se carga el record de oportuniddad
	        var objReceipt = record.load({
				type: 'itemreceipt',
                id: recordid,
                isDynamic: false,
            });
	        
	        var date= objReceipt.getValue('trandate');
	        
	        /*var date = format.format({
	        	value: date_aux ,
                type: format.Type.DATE
	        })*/
            var referencia = objReceipt.getValue('tranid');
	        var name= objReceipt.getValue('entityname');

            log.debug('name', name)
             log.debug('referencia', referencia)
            log.debug('date', date) 
            }catch(err){
            log.error("xa",err);
        }
	        //se extrae el cliente
	        /*var entity = parseInt(objOP.getValue('entity'));
    		var fieldsLookUp = search.lookupFields({
                type: 'customer',
                id: entity,
                columns: ['salesrep','email']
            });
    		var email_customer = fieldsLookUp.email;
    		//se extrae el representante
	        var idUSer = parseInt(fieldsLookUp.salesrep[0].value);
	        
            */
	        
	        
	    	//obtiene imagen de logo
            var logodURL 

            if(runtime.envType  == "SANDBOX"){
                logodURL = getImage('2461144') //id imagen vorwerk tm s green sandbox  
            }else{
                logodURL = getImage('2576941') //id imagen vorwerk tm s green prod
            }

	        //sb1510040
	        //obtiene imagen de check false 

	        /*var checkfieldURL = getImage('1636738');//sb1510039
	        //obtiene imagen check true
	        var checkfieldURL_true = getImage('1636741');//1510241
	        //genera imagen de check false
	       */
	        if(method == 'GET'){
	        	//proceso para retornar PDF
		        mainCreateXML(context,idTpl,recordid,logodURL);
	        }
	        /*if(method == 'PUT'){
	        	//proceso para enviar Email
	        	mainCreateEmailtoSend(objOP,idTpl,idUSer,entity,recordid,logodURL,date,order,checkfieldURL,checkfieldURL_true,email_customer);
	        }*/
    	
    }
    function mainCreateXML(context,idTpl,recordid,logodURL){
    	
        try
        {   log.debug('inicia pdf')
            var bodyPDF = getTemplate(idTpl,recordid)
            var xml = createXML(logodURL,bodyPDF)//crea xml para pdf
           
            
            //conviete cml a pdf para retornarlo en la vista
            var file_xml = render.xmlToPdf({
                            xmlString: xml
                        });
            context.response.addHeader({
                 name: 'Content-Type',
                 value: 'application/pdf'
             });
             var renderer = render.create();
             renderer.templateContent = file_xml.getContents();
             context.response.write(renderer.templateContent);
            log.debug('ret xml')
          
           }catch(err){
            log.error("error createxml",err)
        }
    }
    
    function getImage(idImg){
    	try{
    		var host = "https://3367613-sb1.app.netsuite.com";
    		//obtiene imagen de chekc false
	        var fileObj = file.load({
	            id: idImg//'1510039'
	        });
    		var url_img = fileObj.url
    		url_img = stringToArray(url_img,38);
    		url_img   = url_img.join('&amp;');
    		url_img   = "src='" + host + url_img + "'/";
    		
    		return url_img;
    	}catch(err){
    		log.error("error getImage",err)
    	}
    }
    function getTemplate(idTpl,recordid){
    	try{
             log.debug('template')
             var myMergeResult = render.mergeEmail({
                templateId: idTpl,
                            
                //transactionId: recordid
            });
            return myMergeResult.body
    	}catch(err){
    		log.error("error getTemplate",err)
    	}
    }
    function stringToArray(str,base,opc){
      if(str != ''){
    	  var multiSelectStringArray = str.split(String.fromCharCode(base));
    	  return multiSelectStringArray;
      }else{
          switch(opc)
          {
            case 0:
              return null;
            break;
            case 1:
              return '';
            break;
            default:
              return new Array();
            break;
          }  
      }
    }
    function createXML(logodURL,emailBody){
    	try{
            log.debug('xml')
    		var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
    		    + "<pdf>"
    		    + '<head></head>'
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter">'
    			+'<img height="70" width="160" align="center" ' + logodURL +'>'
    			+'<p align="center" style="font-size:14pt; font-weight: bold;">RECEPCÍON DE MERCANCÍAS</p>'
    			+'<table border="0" cellpadding="1" cellspacing="1" style="width: 663px;">'
    			+'<tbody>'
    			+'<tr>'
    			+'<td Colspan="1" style="width: 120px; font-size: 12px;text-align: left;"><b>No. DE RECEPCIÓN:</b></td>'
    			+'<td colspan="2" style="width: 107px; font-size: 12px;text-align: left;"><b>'+'name'+'</b></td>'
                +'<td Colspan="3" rowspan= "1" style="width: 120px; font-size: 12px;text-align: right;"><b>PROVEEDOR:</b></td>'
                +'<td colspan="4" rowspan= "1" style="width: 107px; font-size: 12px;text-align: right;"><b>'+'name'+'</b></td>'
    			+'</tr>'
    			+'<tr>'
    			+'<td style="width: 120px; font-size: 12px;"><b>FECHA DE RECEPCIÓN:</b></td>'
    			+'<td style="width: 107px; font-size: 12px;"><b>'+'date_create'+'</b></td>'
                +'<td style="width: 120px; font-size: 12px;text-align: right"><b>REMISIÓN/FACTURA:</b></td>'
                +'<td style="width: 107px; font-size: 12px;text-align: right"><b>'+'date_create'+'</b></td>'
    			+'</tr>'
                +'<tr>'
                +'<td style="width: 120px; font-size: 12px;"><b>UBICACIÓN:</b></td>'
                +'<td style="width: 107px; font-size: 12px;"><b>'+'date_create'+'</b></td>'
                +'<td style="width: 120px; font-size: 12px;text-align: right"><b>ORDEN DE VENTA:</b></td>'
                +'<td style="width: 107px; font-size: 12px;text-align: right"><b>'+'date_create'+'</b></td>'
                +'</tr>'
    			+'</tbody>'
    			+'</table>'
    			
                + emailBody
                + '</body>'
                + '</pdf>'
    		return xml;
    	}catch(error){
    		log.debug('errcreateXML',error)
    	}
    }
    function createHTML(logodURL,emailBody,date,order){
    	try{
    		var space = '&nbsp;';
    		var t_space= ""
    		for(var x = 0; x<100; x++){
    			t_space+=space;
            }
    		
    		var html ="<html>"
    		    + '<head><style>'
    		    +'.IMAGELOGO{'
    			+'position: relative;'
    		    +'left: 35%;'
    			+'}'
    			+'.LINEAHT{'
    			+'border-bottom:1.5px solid black;'
    			+'}'
    			+'IMAG{'
    			+'top:-10px;}'
    			+'.BORDE{'
    			+'border-radius: 15px 15px 15px 15px;}'
    			+'.CAJA{'
    			+'border: solid 2px #000;'
    			+'border-radius: 10px;};'
    			+'</style>'
    			+'<macrolist>'
    			+'    <macro id="nlheader">'
    			+t_space+'<img class="IMAGELOGO" height="80" width="100" align="center" ' + logodURL +'>'
    			+'<p>ORDEN DE SERVICIO T&Eacute;CNICO</p>'
    			+'<table border="0" cellpadding="1" cellspacing="1" style="width: 1000px;">'
    			+'<tbody>'
    			+'<tr>'
    			+'<td rowspan="3" style="width: 750px;">Vorwerk M&eacute;xico, S. de R.L. de C.V.<br />'
    			+'Vito Alessio Robles 38 Col. Florida, Del. &Aacute;lvaro Obreg&oacute;n<br />'
    			+'Cd. de M&eacute;xico, C.P.01030 Tel&eacute;fono: 800 200 1121<br />'
    			+'www.thermomix.mx</td>'
    			+'<td style="width: 171px;"> </td>'
    			+'<td style="width: 107px;"> </td>'
    			+'</tr>'
    			+'<tr>'
    			+'<td Colspan="1" style="width: 120px; padding-left: 80px; text-align: right;">Orden de Servicio</td>'
    			+'<td  colspan="2" class="linea" style="width: 107px; text-align: right;">'+order+'</td>'
    			+'</tr>'
    			+'<tr>'
    			+'<td style="width: 120px; padding-left: 90px; text-align: right;">Fecha</td>'
    			+'<td  style="width: 107px; text-align: right;">'+date+'</td>'
    			+'</tr>'
    			+'<tr>'
    			+'<td style="width: 120px;"></td>'
    			+'<td style="width: 107px;"></td>'
    			+'</tr>'
    			+'</tbody>'
    			+'</table>'
    			+'    </macro>'
    			+'    <macro id="nlfooter">'
    			+'        <p>&nbsp;</p>'
    			+'    </macro>'
    			+'</macrolist></head>'
                + '<body header="nlheader" header-height="7%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter">'
                +bodyPDF
                + '</body>'
                + '</html>'
    		return html;
    		
    	}catch(erro){
    		log.debug('errcreateHTML',erro)
    	}
    }
    
    /*function getChecks(objOP,tempalte,checkfalse,checktrue){
    	try{
    		if(objOP.getValue('custbody_garantia')){
                tempalte = tempalte.replace(/@custbody_garantia_yes/g,checktrue);
                tempalte = tempalte.replace(/@custbody_garantia_no/g,checkfalse);
            }else{
                tempalte = tempalte.replace(/@custbody_garantia_yes/g,checkfalse);
                tempalte = tempalte.replace(/@custbody_garantia_no/g,checktrue);
            }
    		if(objOP.getValue('custbody61')){
                tempalte = tempalte.replace(/@v_golpeado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@v_golpeado/g,checkfalse);
            }
            if(objOP.getValue('custbody62')){
                tempalte = tempalte.replace(/@v_desgasta/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@v_desgasta/g,checkfalse);
            }
            if(objOP.getValue('custbody63')){
                tempalte = tempalte.replace(/@v_rayado/g,checktrue);
            }else{
                tempalte =tempalte.replace(/@v_rayado/g,checkfalse);
            }
            if(objOP.getValue('custbody64')){
                tempalte = tempalte.replace(/@a_golpeado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@a_golpeado/g,checkfalse);
            }
            if(objOP.getValue('custbody65')){
                tempalte = tempalte.replace(/@a_desgasta/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@a_desgasta/g,checkfalse);
            }
            if(objOP.getValue('custbody66')){
                tempalte = tempalte.replace(/@a_rayado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@a_rayado/g,checkfalse);
            }
            if(objOP.getValue('custbody67')){
                tempalte = tempalte.replace(/@e_golpeado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@e_golpeado/g,checkfalse);
            }
            if(objOP.getValue('custbody68')){
                tempalte = tempalte.replace(/@e_desgasta/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@e_desgasta/g,checkfalse);
            }
            if(objOP.getValue('custbody69')){
                tempalte = tempalte.replace(/@e_rayado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@e_rayado/g,checkfalse);
            }
            if(objOP.getValue('custbody70')){
                tempalte = tempalte.replace(/@p_golpeado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@p_golpeado/g,checkfalse);
            }
            if(objOP.getValue('custbody71')){
                tempalte = tempalte.replace(/@p_desgasta/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@p_desgasta/g,checkfalse);
            }
            if(objOP.getValue('custbody72')){
                tempalte = tempalte.replace(/@p_rayado/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@p_rayado/g,checkfalse);
            }
            if(objOP.getValue('custbody75')){
                tempalte = tempalte.replace(/@otros/g,checktrue);
            }else{
                tempalte = tempalte.replace(/@otros/g,checkfalse);
            }
    		return tempalte;
    	}catch(err){
    		log.error("error getChecks",err)
    	}
    }
    function sendEmail(html,client){
    	try{
    		log.debug('client',client);
    		email.send({
				author: '344096',
				recipients: [client],
				subject: 'Garantia',
				body: html
    		}); 
    	}catch(err){
    		log.error("error send email",err)
    	}
    }*/
    return {
        onRequest: onRequest
    };
    
});

