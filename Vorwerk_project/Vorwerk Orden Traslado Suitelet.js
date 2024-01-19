/**
suitelet
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render','N/email','N/file','N/record','N/search','N/format','N/runtime','N/format/i18n'],

function(render,email,file,record,search,format,runtime,formati18n) {
   
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
            
            var objOrdenTras = record.load({
                type: 'itemfulfillment',
                id: recordid,
                isDynamic: false,
            });
            
            var noOT = objOrdenTras.getValue('tranid');
            var fecha = objOrdenTras.getText('trandate');
            var destino = objOrdenTras.getText('transferlocation');
            var locDestinno = objOrdenTras.getValue('transferlocation');
            //obtener datos del location
            var locDest = record.load({
                type: 'location',
                id: locDestinno,
                isDynamic: false,
            });
            var encargadoDestID= locDest.getValue('custrecord_responsable')
            var encargadoDestino= locDest.getText('custrecord_responsable')
            var direccionDestino = locDest.getValue('mainaddress_text')
            //obtener datos del employee
            var emp = record.load({
                type: 'employee',
                id: encargadoDestID,
                isDynamic: false,
            });
            var noTelDestino = emp.getValue('custentity_telt')
            var numLines = objOrdenTras.getLineCount({
                sublistId: 'item'
            });
            
            var strTable = "<table width='670px'>";
            strTable += "<tr>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>PARTIDA</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>SKU</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>UNIDAD</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>DESCRIPCIÓN</b></td>";
            strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' color= '#FFFFFF' font-size= '12px' background-color= '#00AC46'><b>CANTIDAD PEDIDA</b></td>";
            strTable += "</tr>";        
            lineaRec=0 
             
            var sumaQuantity = 0
            for(var e =0; e<numLines; e++){
                lineaRec++
                var origen = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location',
                    line: e
                })
                var location = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'location_display',
                    line: e
                })
                
                var quantity = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemquantity',
                    line: e
                })
                sumaQuantity += parseFloat(quantity);
                
                var descripcion = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: e
                })
                
                var sku = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemname',
                    line: e
                })
                
                var unit = objOrdenTras.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'unitsdisplay',
                    line: e
                })
                
               
                strTable += "<tr>";
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + lineaRec + "</td>";
                            
                strTable += "<td border='0.5' align='center'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + sku + "</td>";
                strTable += "<td border='0.5' align='left'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + unit + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + descripcion + "</td>";
                strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'>" + currencyFormat(quantity) + "</td>";
                strTable += "</tr>";
            }
            //obtener datos del location origen
            var locOrigen = record.load({
                type: 'location',
                id: origen,
                isDynamic: false,
            });
            var encargadoOrID= locOrigen.getValue('custrecord_responsable')
            var encargadoOrigen= locOrigen.getText('custrecord_responsable')
            var direccionOrigen = locOrigen.getValue('mainaddress_text')
            //obtener datos del employee origen
            var empOr = record.load({
                type: 'employee',
                id: encargadoOrID,
                isDynamic: false,
            });
            var noTelOrigen = empOr.getValue('custentity_telt')

            var numLines = objOrdenTras.getLineCount({
                sublistId: 'item'
            }); 
            var total = sumaQuantity
                log.debug('total', total)
                total = parseInt(total)
                log.debug('total', total)
                total =  currencyFormat(total)
                log.debug('total', total)
            strTable += "<tr>";
            strTable += "<td colspan= '4'  align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>TOTAL</b></td>";
            strTable += "<td border='0.5' align='right'  font-family= 'Arial,Helvetica,sans-serif' font-size= '12px'><b>" + total + "</b></td>";
            strTable += "</tr>";            
            strTable += "</table>";
            
            bodyPDF = strTable;
            
           
            
            var xml = createXML(logodURL,bodyPDF,noOT,fecha,destino,origen,location,direccionDestino,noTelDestino,encargadoDestino,encargadoOrigen,direccionOrigen,noTelOrigen)//crea xml para pdf
           
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
    function createXML(logodURL,emailBody,noOT,fecha,destino,origen,location,direccionDestino,noTelDestino,encargadoDestino,encargadoOrigen,direccionOrigen,noTelOrigen){
        try{
            log.debug('xml')
            var xml = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n"
                + "<pdf>"
                + '<head>'
                +'<macrolist>'
                            +'<macro id=\"myheader\">'
                                +'<img height="70" width="160" align="center" ' + logodURL +'>'
                                +'<p align="center" style="font-weight: bold;font-family:Arial,Helvetica,sans-serif; font-size:16px;">' +'ORDEN DE TRASLADO: ' + noOT+'</p>' 
                                +'<table cellpadding="1" style="font-size: 13px; width: 600px; margin-top: 5px;">'
                                    +'<tbody>'
                                        +'<tr>'
                                        +'<td style="height: 14px; width: 90 px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">RUTA:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 261px;"><span style="font-family:Arial,Helvetica,sans-serif;"><span style="font-size: 12px;">______________________</span></span></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 70px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">FECHA:</span></span></strong></td>'
                                        +'<td class="linea LINEAHT" style="height: 14px; width: 147px; text-align: left; vertical-align: left;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+fecha+'</span></span><br />'
                                        +'</td>'
                                        +'</tr>'
                                    +'</tbody>'
                                    +'</table>'
                                    +'<table cellpadding="1" style="width:677px; margin-top:5px;">'
                                        +'<tbody>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">TRANSPORTE:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">______________________</span></span></td>'
                                            +'<td style="width: 90 px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">   UNIDAD:</span></span></strong></td>'
                                            +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">______________________</span></span></td>'
                                            +'&nbsp;'
                                            +'</tr>'
                                        +'</tbody>'
                                        +'</table>'
                                    +'<table cellpadding="2" style="width:677px; margin-top:5px;">'//ORIGEN
                                        +'<tbody>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">ORIGEN:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+location+'</span></span></td>'
                                            +'<td style="width: 80px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">RESPONSABLE:</span></span></strong></td>'
                                            +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+encargadoOrigen+'</span></span></td>'
                                            +'</tr>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">DIRECCIÓN:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+direccionOrigen+'</span></span></td>'
                                            +'<td style="width: 80px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">TELEFONO:</span></span></strong></td>'
                                            +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+noTelOrigen+'</span></span></td>'
                                            +'&nbsp;'
                                            +'</tr>'
                                        +'</tbody>'
                                    +'</table>'
                                    +'<table cellpadding="2" style="width:677px; margin-top:5px;">'//DESTINO
                                        +'<tbody>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">DESTINO:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+destino+'</span></span></td>'
                                            +'<td style="width: 80px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">RESPONSABLE:</span></span></strong></td>'
                                            +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+encargadoDestino+'</span></span></td>'
                                            +'&nbsp;'
                                            +'</tr>'
                                            +'<tr>'
                                            +'<td style="width: 119px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">DIRECCIÓN:</span></span></strong></td>'
                                            +'<td class="linea LINEAHT" style="width: 225px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+direccionDestino+'</span></span></td>'
                                            +'<td style="width: 80px;"><strong><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">TELEFONO:</span></span></strong></td>'
                                            +'<td style="width: 218px; text-align: center;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">'+noTelDestino+'</span></span></td>'
                                            +'&nbsp;'
                                            +'</tr>'
                                        +'</tbody>'
                                    +'</table>'
                            +'</macro>'
                            +'<macro id=\"paginas\">'
                                +'<p font-family=\"Helvetica\" font-size=\"8\" align=\"center\">Vorwerk México, S. de R.L. de C.V. Vito Alessio Robles 38  Col. Florida   C.P. 01030 Del. Álvaro Obregón, México, D.F.   RFC: VME060622GL2</p>'
                                +'<p font-family=\"Helvetica\" font-size=\"6\" align=\"right\">Página <pagenumber/> de <totalpages/></p>'
                            +'</macro>'

                +'</macrolist>'            
                +'</head>'
                + '<body footer-height="20pt" padding="0.5in 0.5in 0in 0.5in" margin= "0in 0in 0.5in 0in" size="Letter" header=\"myheader\" header-height=\"300pt\" footer=\"paginas\">'
                + emailBody
                +'&nbsp;'
                +'<table align="left" border="0" cellpadding="1" cellspacing="1" style="width: 677.818px;">'
                    +'<tbody>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">__________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">ALMACEN</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">RECIBE</span></span></td>'
                        +'</tr>'
                    +'</tbody>'
                +'</table>'
                +'&nbsp;'
                +'<table align="left" border="0" cellpadding="1" cellspacing="1" style="width: 677.818px;">'
                    +'<tbody>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">COMENTARIOS:</span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">_____________________________________________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;"></span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">_____________________________________________________________</span></span></td>'
                        +'</tr>'
                        +'<tr>'
                        +'<td style="width: 112px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;"></span></span></td>'
                        +'<td style="width: 175px; height: 26px;"><span style="font-size:12px;"><span style="font-family:Arial,Helvetica,sans-serif;">_____________________________________________________________</span></span></td>'
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
                if(v && v!=''){
                    
                    var vFlotante = format.parse({value:v, type: format.Type.FLOAT}) //Sin , ni . ni texto
                    var rulesFormat = formati18n.getNumberFormatter({ //Reglas de formato
                        groupSeparator: ",",
                        decimalSeparator: ".",
                        precision: 0
                    });

                    var vformat = rulesFormat.format({number: vFlotante})
                    return vformat
                }else{
                    return '';
                }
            }catch(err){
                log.error('err currencyFormat',err);
            }
            
        }
      
    
    return {
        onRequest: onRequest
    };
    
});

