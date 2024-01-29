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
            
            var objReceipt = record.load({
                type: 'itemreceipt',
                id: recordid,
                isDynamic: false,
            });
                        
           
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
                mainCreateXML(context,recordid,logodURL);
            }
            
        
    }
    function mainCreateXML(context,recordid,logodURL){
        
        try{   
            log.debug('inicia pdf')
            var objReceipt = record.load({
                type: 'itemreceipt',
                id: recordid,
                isDynamic: false,
            });
            var ordenCompra= objReceipt.getText('createdfrom')
                ordenCompra = ordenCompra.split('#')
                ordenCompra = ordenCompra[1]
            var proveedor = objReceipt.getText('entity')
                proveedor = proveedor.replace(/&/g, "&amp;");
            var fechaRecepcion = objReceipt.getText('trandate')
            var remisionFactura = objReceipt.getValue('custbody_remision_factura')
            var noRecepcion = objReceipt.getValue('tranid')
            var numLines = objReceipt.getLineCount({
                sublistId: 'item'
            });
            var strTable = "<table width='670px'>";
            strTable += "<tr>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>#</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>SKU</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>DESCRIPCIÓN</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>CANTIDAD (pz)</b></td>";
            
            strTable += "</tr>";        
            lineaRec=0 
            var sumaQuantity = 0            
            for(var e =0; e<numLines; e++){
                lineaRec++
                var location = objReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location_display',
                    line: e
                })
                var quantity = objReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: e
                })
                quantity2 = currencyFormat(quantity)
                log.debug('quantity', quantity)
                sumaQuantity += parseFloat(quantity);
                log.debug('sumaQuantity', sumaQuantity)
                var descripcion = objReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemdescription',
                    line: e
                })
                    descripcion = descripcion.replace(/&/g, "&amp;");

                var sku = objReceipt.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: e
                })
                
                strTable += "<tr>";
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + lineaRec + "</td>";
                            
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + sku + "</td>";
                strTable += "<td border='0.5' align='left'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + descripcion + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + quantity2 + "</td>";
                
                strTable += "</tr>";
            }
            var total = sumaQuantity
            log.debug('total 1', total)
                total = parseFloat(total)
                log.debug('total2', total)
                total =  currencyFormat(total)
                log.debug('total 3',total)
            strTable += "<tr>";
            strTable += "<td colspan= '3'  align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>TOTAL</b></td>";
            strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>" + total + "</b></td>";
            strTable += "</tr>";            
            strTable += "</table>";
            
            log.debug('location', location)
             
            var bodyPDF = strTable         
            
            var xml = createXML(logodURL,bodyPDF,ordenCompra,proveedor,fechaRecepcion,remisionFactura,noRecepcion,location)//crea xml para pdf
           
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
    function createXML(logodURL,emailBody,ordenCompra,proveedor,fechaRecepcion,remisionFactura,noRecepcion,location){
        try{
            log.debug('xml')
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head>'
                +'<macrolist>'
                            +'<macro id=\"myheader\">'
                                +'<img height="70" width="160" align="center" ' + logodURL +'>'
                                +'<p align="center" style="font-weight: bold;font-family:Arial,Helvetica,sans-serif; font-size:14px;">RECEPCIÓN DE MERCANCÍAS</p>' 
                                +'<table cellpadding="0" style="font-size: 13px; width: 662px; margin-top: 5px;">'
                                    +'<tbody>'
                                        +'<tr>'
                                        +'<td style="height: 14px; width: 91px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">PROVEEDOR:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 237px; text-align: left;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+proveedor+'</span></span></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 146px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">FECHA DE RECEPCIÓN:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 168px; text-align: center; vertical-align: middle;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+fechaRecepcion+'</span></span><br />'
                                        +'&nbsp;</td>'
                                        +'</tr>'
                                    +'</tbody>'
                                +'</table>'
                                +'<table cellpadding="0" style="width:662px; margin-top:5px;">'
                                    +'<tbody>'
                                        +'<tr>'
                                        +'<td style="width: 57px; height: 33px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;"><strong>REMISI&Oacute;N/FACTURA:</strong>&nbsp;</span></span></td>'
                                        +'<td class="linea LINEAHT" style="width: 182px; height: 33px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+remisionFactura+'</span></span>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</td>'
                                        +'<td style="width: 127px; height: 33px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;"><strong>ORDEN DE COMPRA</strong>:</span></span></td>'
                                        +'<td class="linea LINEAHT" style="width: 204px; height: 33px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+ordenCompra+'</span></span></td>'
                                        +'</tr>'
                                    +'</tbody>'
                                +'</table>'
                                +'<table cellpadding="0" style="width:662px; margin-top:5px;">'
                                    +'<tbody>'
                                        +'<tr>'
                                        +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">No. DE RECEPCI&Oacute;N:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="width: 210px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+noRecepcion+'</span></span></td>'
                                        +'<td style="width: 94px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">UBICACIÓN:</span></span></strong></td>'
                                        +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+location+'</span></span></td>'
                                        +'</tr>'
                                    +'</tbody>'
                                +'</table>'

                            +'</macro>'
                            +'<macro id=\"paginas\">'
                                +'<p font-family=\"Helvetica\" font-size=\"6\" align=\"right\">Página <pagenumber/> de <totalpages/></p>'
                            +'</macro>'

                +'</macrolist>'            
                +'</head>'
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter" header=\"myheader\" header-height=\"200pt\" footer=\"paginas\">'
                
                +'&nbsp;'
                + emailBody
                +'&nbsp;'
                +'&nbsp;'
                +'<table align="left" border="0" cellpadding="1" cellspacing="1" style="width: 655px;">'
                    +'<tbody>'
                        +'<tr>'
                        +'<td style="width: 253px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Recibido por:&nbsp;</span></span><br />'
                        +'&nbsp;</td>'
                        +'<td style="width: 116px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Revisado por:</span></span><br />'
                        +'&nbsp;</td>'
                        +'<td style="width: 140px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Sello de recibido</span></span><br />'
                        +'&nbsp;</td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 253px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">________________________________&nbsp;</span></span><br />'
                        +'<span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Nombre y Firma&nbsp; &nbsp;</span></span></td>'
                        +'<td style="width: 116px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">____________________________________<br />'
                        +'Nombre y Firma&nbsp; &nbsp;</span></span></td>'
                        +'<td style="width: 140px;">&nbsp;</td>'
                        +'</tr>'
                    +'</tbody>'
                    +'</table>'
                + '</body>'
                + '</pdf>'
            return xml;
        }catch(error){
            log.debug('errcreateXML',error)
        }
    }
    function currencyFormat(v){
            try{
                var amt     = v;
                    amt     = amt.toString();
                    amt     = amt.split('.');
                var amtl    = amt[0].length;
                var amtt    = '';
                var n       = 0;
                for(var a=amtl-1;a>=0; a--)
                {
                    if(n==3)
                    {
                        amtt = amtt + ',' + amt[0].charAt(a); n=1;
                    }
                    else
                    {
                        amtt = amtt + amt[0].charAt(a) ; n++;
                    }
                }
                var amttt = '';
                for(var a=0;a<=amtt.length;a++)
                {
                    amttt += amtt.charAt(amtt.length-a);
                }
                if(amt[1] == '')
                {
                    return v = amttt + '.00';
                }
                else
                {
                    return v = amttt;
                }
            }catch(err){
                log.error('err currencyFormat',err);
            }
            
        }
   
    return {
        onRequest: onRequest
    };
    
});

