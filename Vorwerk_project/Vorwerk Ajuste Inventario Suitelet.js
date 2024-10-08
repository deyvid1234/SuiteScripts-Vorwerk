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
            var recordid = recordid = parseInt(params.oppID,10);
            log.debug('method',method);
                        
            
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
    function mainCreateXML(context,recordid,logodURL,location){
        
        try
        {   log.debug('inicia pdf')
            
            var objAdjustment = record.load({
                type: 'inventoryadjustment',
                id: recordid,
                isDynamic: false,
            });
            var total = objAdjustment.getValue('estimatedtotalvalue');
            var noAjuste = objAdjustment.getValue('tranid');
            var fechaRecepcion = objAdjustment.getText('trandate');
            var causaAjuste= objAdjustment.getText('custbody_causa_ajuste');
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
               
                strTable += "<tr>";
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + lineaRec + "</td>";
                            
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + sku + "</td>";
                strTable += "<td border='0.5' align='left'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + descripcion2 + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + currencyFormat(quantity) + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + currencyFormat(unitCost) + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + currencyFormat(importe)  + "</td>";
                strTable += "</tr>";
            }
            
            strTable += "<tr>";
            strTable += "<td colspan= '5'  align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>TOTAL</b></td>";
            strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>" + currencyFormat(total) + "</b></td>";
            strTable += "</tr>";            
            strTable += "</table>";
            
            bodyPDF = strTable;
            
           
            
            var xml = createXML(logodURL,bodyPDF,noAjuste,movimiento,fechaRecepcion,causaAjuste,location)//crea xml para pdf
           
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
    function createXML(logodURL,emailBody,noAjuste,movimiento,fechaRecepcion,causaAjuste,location){
        try{
            log.debug('xml')
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head>'
                +'<macrolist>'
                            +'<macro id=\"myheader\">'
                                +'<img height="70" width="160" align="center" ' + logodURL +'>'
                                +'<p align="center" style="font-weight: bold;font-family:Arial,Helvetica,sans-serif; font-size:16px;">' +'AJUSTE DE INVENTARIO: ' + noAjuste+'</p>' 
                                +'<table cellpadding="0" style="font-size: 13px; width: 662px; margin-top: 5px;">'
                                    +'<tbody>'
                                        +'<tr>'
                                        +'<td style="height: 14px; width: 86px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">MOVIMIENTO:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 261px;"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size: 12px;">'+movimiento+'</span></span></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 148px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">FECHA DE RECEPCI&Oacute;N:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 147px; text-align: center; vertical-align: middle;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+fechaRecepcion+'</span></span><br />'
                                        +'&nbsp;</td>'
                                        +'</tr>'
                                    +'</tbody>'
                                    +'</table>'
                                    +'<table cellpadding="0" style="width:662px; margin-top:5px;">'
                                        +'<tbody>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">CAUSA DE AJUSTE:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+causaAjuste+'</span></span></td>'
                                            +'<td style="width: 80px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">UBICACIÓN:</span></span></strong></td>'
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
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter" header=\"myheader\" header-height=\"170pt\" footer=\"paginas\">'
                + emailBody
                +'&nbsp;'
                +'<table align="left" border="0" cellpadding="1" cellspacing="1" style="width: 677.818px;">'
                    +'<tbody>'
                        +'<tr>'
                        +'<td style="width: 112px;">&nbsp;</td>'
                        +'<td style="width: 175px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Firma</span></span></strong></td>'
                        +'<td style="width: 180px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Nombre:&nbsp;</span></span></strong></td>'
                        +'<td style="width: 189px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">&nbsp;Puesto:</span></span></strong></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Elabor&oacute;:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 189px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Revis&oacute;:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 189px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Supervis&oacute;:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 189px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Autori&oacute;:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 189px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Recibi&oacute;:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 189px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 31px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">Fecha de recibido:</span></span></td>'
                        +'<td style="width: 175px; height: 31px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 180px; height: 31px;">&nbsp;</td>'
                        +'<td style="width: 189px; height: 31px;">&nbsp;</td>'
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

