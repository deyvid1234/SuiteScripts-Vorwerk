/**
suitelet
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
            
             
            var idTpl = 273;//
            
            
            }catch(err){
            log.error("xa",err);
        }
            
            
            
            //obtiene imagen de logo
            var logodURL 

            if(runtime.envType  == "SANDBOX"){
                logodURL = getImage('2461144') //id imagen vorwerk tm s green sandbox  
            }else{
                logodURL = getImage('2576941') //id imagen vorwerk tm s green prod
            }

            
            if(method == 'GET'){
                //proceso para retornar PDF
                mainCreateXML(context,idTpl,recordid,logodURL);
            }
           
        
    }
    function mainCreateXML(context,idTpl,recordid,logodURL,location){
        
        try
        {   log.debug('inicia pdf')
            var bodyPDF = getTemplate(idTpl,recordid)
            var objAdjustment = record.load({
                type: 'inventoryadjustment',
                id: recordid,
                isDynamic: false,
            });
            var total = objAdjustment.getValue('estimatedtotalvalue');
            var movimiento 
            if(total <0){
                movimiento = "Salida de inventario"
            } else{
                movimiento = "Entrada de inventario"
            }
            log.debug('total', total)
            var numLines = objAdjustment.getLineCount({
                sublistId: 'inventory'
            });
             log.debug('inicia pdf1')
            var strTable = "<table width='670px'>";
            strTable += "<tr>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>#</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>SKU</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>DESCRIPCIÓN</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>CANTIDAD (pz)</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>COSTO PROMEDIO</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>IMPORTE</b></td>";
            strTable += "</tr>";        
            lineaRec=0 
             log.debug('inicia pdf2')

            for(var e =0; e<numLines; e++){
                lineaRec++
                var location = objAdjustment.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'location_display',
                    line: e
                })
                var quantity = objAdjustment.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'adjustqtyby',
                    line: e
                })
                
                var descripcion = objAdjustment.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item_display',
                    line: e
                })
                descripcion1 = descripcion.split(' ');
                descripcion1.shift()
                descripcion2 = descripcion1.join(' ');
                descripcion2  = descripcion2.replace(/&/g, "&amp;");
                var sku = objAdjustment.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'item_display',
                    line: e
                })
                sku = sku.split(' ');
                sku = sku[0]

                var unitCost = objAdjustment.getSublistValue({
                    sublistId: 'inventory',
                    fieldId: 'avgunitcost',
                    line: e
                })
                var importe = quantity*unitCost 
                importe= importe.toFixed(2);
                log.debug('location', location)
                log.debug('quantity', quantity) 
                log.debug('sku', sku)
                log.debug('descripcion', descripcion2)
                log.debug('importe', importe)
                log.debug('inicia pdf3')
                strTable += "<tr>";
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + lineaRec + "</td>";
                            
                strTable += "<td border='0.5' align='left'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + sku + "</td>";
                strTable += "<td border='0.5' align='left'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + descripcion2 + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + quantity + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + unitCost + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + importe  + "</td>";
                strTable += "</tr>";
                log.debug('inicia pdf4')
                
            }
            log.debug('inicia pdf5')
            strTable += "<tr>";
            strTable += "<td colspan= '5'  align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>TOTAL</b></td>";
            strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>" + total + "</b></td>";
            strTable += "</tr>";            
            strTable += "</table>";
            log.debug('inicia pdf6')
                
            bodyPDF = bodyPDF.replace(/@custbody_location/g,location);
            bodyPDF = bodyPDF.replace(/@movimiento/g,movimiento);
            bodyPDF = bodyPDF.replace(/@tabla/g,strTable);
            
           log.debug('inicia pdf7')
            
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
            
             var myMergeResult = render.mergeEmail({
                templateId: idTpl,
                            
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
    function createXML(logodURL,emailBody){
        try{
            log.debug('xml')
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head></head>'
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter">'
                +'<img height="70" width="160" align="center" ' + logodURL +'>'
                +'<p align="center" style="font-weight: bold;font-family:Arial,Helvetica,sans-serif; font-size:16px;">AJUSTE DE INVENTARIO</p>'
                +'<table border="0" cellpadding="1" cellspacing="1" style="width: 663px;">'
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
    
    
    return {
        onRequest: onRequest
    };
    
});

