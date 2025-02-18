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
            var recordid = recordid = parseInt(params.oppID);
            log.debug('method',method);
            
             
            var idTpl = 268;
            var sendEmail = params.emailSend;
            log.debug('params',params);
            //se carga el record de oportuniddad
            var objOP = record.load({
                type: 'opportunity',
                id: recordid,
                isDynamic: false,
            });
            
            var date_aux= objOP.getValue('trandate');
            
            var date = format.format({
                value: date_aux ,
                type: format.Type.DATE
            })
            var order= objOP.getValue('tranid');
            //se extrae el cliente
            var entity = parseInt(objOP.getValue('entity'));
            var fieldsLookUp = search.lookupFields({
                type: 'customer',
                id: entity,
                columns: ['salesrep','email']
            });
            var email_customer = fieldsLookUp.email;
            //se extrae el representante
            var idUSer = parseInt(fieldsLookUp.salesrep[0].value);
            
            
            
            //obtiene imagen de logo
            var logodURL = getImage()

            
            //sb1510040
            //obtiene imagen de check false 
            var idImg 
            var idImgTrue
            if(runtime.envType  == "SANDBOX"){
                idImg = '1636738';
                idImgTrue = '1636741'
            //id imagen vorwerk tm s green sandbox  
            }else{
                idImg = '3175160';
                idImgTrue = '3175159'
                
            }
            
            var checkfieldURL = getImageCheck(idImg);//sb1510039
            //obtiene imagen check true
            
            var checkfieldURL_true = getImageCheck(idImgTrue);//1510241
            //genera imagen de check false
           
            if(method == 'GET'){
                //proceso para retornar PDF
                mainCreateXML(context,objOP,idTpl,idUSer,entity,recordid,checkfieldURL,checkfieldURL_true,date,order,logodURL);
            }
            if(method == 'PUT'){
                //proceso para enviar Email
                mainCreateEmailtoSend(objOP,idTpl,idUSer,entity,recordid,logodURL,date,order,checkfieldURL,checkfieldURL_true,email_customer);
            }
        }catch(err){
            log.debug('errPdf',err)
        }
    }
    function mainCreateXML(context,objOP,idTpl,idUSer,entity,recordid,checkfieldURL,checkfieldURL_true,date,order,logodURL){
        try{
            log.debug("start pdf","enter");
             var imgcheck_fasle = "<img width='30%' height='30%' "+ checkfieldURL +">"
          //genera imagen de check false
            var imgcheck_check_true = "<img width='14px' height='14px' "+ checkfieldURL_true +">"
            //proceso para crear el pdf
            var emailBodyPDF = getTemplate(idTpl,idUSer,entity,recordid)
            var xml = createXML(logodURL,emailBodyPDF,date,order)//crea xml para pdf
            //setea los check correspondinetes 
            xml = getChecks(objOP,xml,imgcheck_fasle,imgcheck_check_true)
            
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
        }catch(err){
            log.error("mainCreateXML",err);
        }
    }
    
    function mainCreateEmailtoSend(objOP,idTpl,idUSer,entity,recordid,logodURL,date,order,checkfieldURL,checkfieldURL_true,email_customer){
        try{
            log.debug("start html","enter");
            //proceso para crear template email
            idTpl = 269;
            var emailBodyEmail = getTemplate(idTpl,idUSer,entity,recordid);
            var html=createHTML(logodURL,emailBodyEmail,date,order);
            //genera imagen de check false
            var imgcheck1_email_false = "<img width='30px' height='30px' "+ checkfieldURL +">"
            //genera imagen de check false
            var imgcheck1_email_true = "<img width='28px' height='28px' "+ checkfieldURL_true +">"
            //setea los check correspondinetes 
            html = getChecks(objOP,html,imgcheck1_email_false,imgcheck1_email_true);
            //envia email
            sendEmail(html,email_customer)
        }catch(err){
            log.error('Error mainCreateEmailtoSend',err)
        }
    }
    function getImageCheck(idImg){
        try{
            var host = "https://3367613-sb1.app.netsuite.com";
             if(runtime.envType  == "SANDBOX"){
                    host = "https://3367613-sb1.app.netsuite.com";
                 
                }else{
                    host = "https://3367613.app.netsuite.com";
                    
                    
                }
            
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

    function getImage(idImg){
            try{
                var host 
                var idImg 

                if(runtime.envType  == "SANDBOX"){
                    host = "https://3367613-sb1.app.netsuite.com";
                    idImg = '2576941';
                //id imagen vorwerk tm s green sandbox  
                }else{
                    host = "https://3367613.app.netsuite.com";
                    idImg = '2576941';
                    //id imagen vorwerk tm s green prod
                }

                
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
    
    
    function getTemplate(idTpl,idUSer,entity,recordid){
        try{
            var myMergeResult = render.mergeEmail({
                templateId: idTpl,
                entity: {
                        type: 'employee',
                        id: idUSer
                },
                recipient: {
                        type: 'customer',
                        id: entity
                },
                transactionId: recordid
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
    function createXML(logodURL,emailBody,date,order){
        try{
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head></head>'
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter">'
                +'<img height="70%" width="70%" align="center" ' + logodURL +'>'
                +'<p align="center" style="font-size:14pt; font-weight: bold; font-family: sans-serif;">ORDEN SERVICIO</p>'
                +'<table border="0" cellpadding="1" cellspacing="1" style="width: 663px;">'
                +'<tbody>'
                +'<tr>'
                +'<td rowspan="3" style="width: 367px; font-size: 12px; font-family: sans-serif; ">Vorwerk M&eacute;xico, S. de R.L. de C.V.<br />'
                +'Vito Alessio Robles 38 Col. Florida, Del. &Aacute;lvaro Obreg&oacute;n<br />'
                +'Cd. de M&eacute;xico, C.P.01030 Teléfono: 800 200 1121<br />'
                +'www.thermomix.mx</td>'
                +'<td style="width: 171px;"> </td>'
                +'<td style="width: 107px;"> </td>'
                +'</tr>'
                +'<tr>'
                +'<td Colspan="1" style="width: 120px; font-size: 12px; font-family: sans-serif;"><b>Orden de Servicio:</b></td>'
                +'<td colspan="2"  style="width: 107px; font-size: 12px; font-family: sans-serif;"><b>'+order+'</b></td>'
                +'</tr>'
                +'<tr>'
                +'<td style="width: 120px; font-size: 12px; font-family: sans-serif;"><b>Fecha:</b></td>'
                +'<td style="width: 107px; font-size: 12px; font-family: sans-serif;"><b>'+date+'</b></td>'
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
            var t_space= "";
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
                +t_space+'<img class="IMAGELOGO" height="80" width="150" align="center" ' + logodURL +'>'
                +'<p style="text-decoration: none; color: rgb(0, 0, 0);">ORDEN DE SERVICIO</p>'
                +'<table border="0" cellpadding="1" cellspacing="1" style="width: 1000px;">'
                +'<tbody>'
                +'<tr>'
                +'<td rowspan="3" style="width: 750px;"><span style="text-decoration: none; color: rgb(0, 0, 0);">Vorwerk M&eacute;xico, S. de R.L. de C.V.<br />'
                +'Vito Alessio Robles 38 Col. Florida, Del. &Aacute;lvaro Obreg&oacute;n<br />'
                +'Cd. de M&eacute;xico, C.P.01030 Tel&eacute;fono: 800 200 1121<br />'
                +'www.thermomix.mx</span></td>'
                +'<td style="width: 171px;"> </td>'
                +'<td style="width: 107px;"> </td>'
                +'</tr>'
                +'<tr>'
                +'<td Colspan="1" style="width: 120px; padding-left: 80px; text-align: right;"><span style="text-decoration: none; color: rgb(0, 0, 0);">Orden de Servicio</span></td>'
                +'<td  colspan="2" class="linea" style="width: 107px; text-align: right;"><span style="text-decoration: none; color: rgb(0, 0, 0);">'+order+'</span></td>'
                +'</tr>'
                +'<tr>'
                +'<td style="width: 120px; padding-left: 90px; text-align: right;"><span style="text-decoration: none; color: rgb(0, 0, 0);">Fecha</span></td>'
                +'<td  style="width: 107px; text-align: right;"><span style="text-decoration: none; color: rgb(0, 0, 0);">'+date+'</span></td>'
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
                +emailBody
                + '</body>'
                + '</html>'
            return html;
            
        }catch(erro){
            log.debug('errcreateHTML',erro)
        }
    }
    
    function getChecks(objOP,tempalte,checkfalse,checktrue){
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
            var emailEnviado = email.send({
                author: '344096',
                recipients: [client],
                cc: ['griselrdz@gmail.com','deyvid8uriel@gmail.com','desarrollo.netsuite@thermomix.mx'],
                subject: 'Garantia',
                body: html
            }); 
            log.debug('emailEnviado',emailEnviado)
        }catch(err){
            log.error("error send email",err)
        }
    }
    return {
        onRequest: onRequest
    };
    
});

