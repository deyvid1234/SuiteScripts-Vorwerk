 /**
  * @NApiVersion 2.x
  * @NScriptType Suitelet
  * @NModuleScope SameAccount
  * @author Carl, Zeng
  * @description This's a sample SuiteLet script(SuiteScript 2.0) to export data
  *              to Excel file and directly download it in browser
  */
 define(
         [ 'N/file', 'N/encode' ],
         /**
          * @param {file}
          *            file
          * @param {format}
          *            format
          * @param {record}
          *            record
          * @param {redirect}
          *            redirect
          * @param {runtime}
          *            runtime
          * @param {search}
          *            search
          * @param {serverWidget}
          *            serverWidget
          */
         function(file, encode) {

             /**
              * Definition of the Suitelet script trigger point.
              *
              * @param {Object}
              *            context
              * @param {ServerRequest}
              *            context.request - Encapsulation of the incoming
              *            request
              * @param {ServerResponse}
              *            context.response - Encapsulation of the Suitelet
              *            response
              * @Since 2015.2
              */
             function onRequest(context) {
              
                 if (context.request.method == 'POST') {
                   try{
                     var request = context.request;
                     var body = JSON.parse(context.request.body);
                       var data=body.obj;
                       var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                       xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                       xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                       xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                       xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                       xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
  
  
                       xmlStr += '<Worksheet ss:Name="Sheet1">';
                       xmlStr += '<Table>'
                                + '<Row>'
                                + '<Cell><Data ss:Type="String">NOMBRE</Data></Cell>'
                            + '<Cell><Data ss:Type="String">COMPENSACIONES DE INGRESO</Data></Cell>'
                            + '<Cell><Data ss:Type="String">UNIDAD</Data></Cell>'
                            + '<Cell><Data ss:Type="String">VENTAS TM Ó VENTAS CK</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">TM PAGADAS PROPIAS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">IDS DE VENTAS PROPIA</Data></Cell>'
                            + '<Cell><Data ss:Type="String">COOK KEY</Data></Cell>'
                            + '<Cell><Data ss:Type="String">COMISION COOK KEY</Data></Cell>'
                            + '<Cell><Data ss:Type="String">Num Garantia</Data></Cell>'
                            + '<Cell><Data ss:Type="String">Monto Garantia</Data></Cell>'
                            + '<Cell><Data ss:Type="String">IDS Garantia</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">VENTAS TM O CK Y TM PAGADAS</Data></Cell>' 
                            + '<Cell><Data ss:Type="String">VENTA PROPIA</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">TM GANADAS</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">ACUMULADO DE VENTAS</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">NÚMERO DE ENTREGAS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">ENTREGA</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO DE PRODUCTIVIDAD</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO VENTA PROPIA TMSB</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO PRODUCTIVIDAD TMSB</Data></Cell>'
                            + '<Cell><Data ss:Type="String">ODV TM SIN BARRERAS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO EMERALD</Data></Cell>'
                            + '<Cell><Data ss:Type="String">ODV DE LAS RECLUTAS</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">TM PAGADAS REC</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">ODV COMISIONABLES REC</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO RECLUTADORA</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String"> Bono Reclutamiento Especial 4a Venta</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">ODV Reclutamiento Especial 4a Venta </Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">BONO TALENTO</Data></Cell>'
                            + '<Cell><Data ss:Type="String"> NUMERO DE ODV DEL EQUIPO</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">TM PAGADAS EQUIPO</Data></Cell>'
                            + '<Cell><Data ss:Type="String">IDS DEL EQUIPO</Data></Cell>'
                            + '<Cell><Data ss:Type="String">%</Data></Cell>'
                            + '<Cell><Data ss:Type="String">VENTA EQUIPO</Data></Cell>'
                            + '<Cell><Data ss:Type="String">NLE</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO NLE</Data></Cell>'
                            + '<Cell><Data ss:Type="String">X+2 NLE</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO 3+2 NLE</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO 5+2 NLE</Data></Cell>'
                           // + '<Cell><Data ss:Type="String">ODV DEL PERIODO MISMO EQUIPO</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">RECLUTAS Y ODV POR RECLUTA DEL LE DEL PERIODO</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO NUEVO RECLUTA</Data></Cell>'
                            + '<Cell><Data ss:Type="String">No.RECLUTAS ACTIVOS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">RECLUTAS ACTIVOS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">BONO ACTIVIDAD</Data></Cell>'
                            + '<Cell><Data ss:Type="String">No. INTGRANTES ACTIVOS</Data></Cell>'
                            + '<Cell><Data ss:Type="String">INTEGRANTES ACTIVOS</Data></Cell>'
                            //+ '<Cell><Data ss:Type="String">RETENCION</Data></Cell>'
                                //+ '<Cell><Data ss:Type="String">AJUSTE</Data></Cell>'
                                //+ '<Cell><Data ss:Type="String">SUBTOTAL</Data></Cell>'
                            + '<Cell><Data ss:Type="String">TOTAL</Data></Cell>'
                            + '</Row>';
                       
                          
                          
                       
                       
                       for(var x = 0; x< data.length; x++ ){
                    	 var num_ck = typeof data[x].num_ck === 'undefined'?"0":data[x].num_ck;
                    	 var total_ck = typeof data[x].total_ck === 'undefined'?"0":data[x].total_ck;	
                    	 var num_garantia = typeof data[x].num_garantia === 'undefined'?"0":data[x].num_garantia;
                    	 var monto_garantia = typeof data[x].monto_garantia === 'undefined'?"0":data[x].monto_garantia;
                    	 var ids_garantia = typeof data[x].ids_garantia === 'undefined'?"0":data[x].ids_garantia;
                         var ventas_propias_num = typeof data[x].ventas_propias_num === 'undefined'?"0":data[x].ventas_propias_num;
                         var ventas_propias_ids = typeof data[x].ventas_propias_ids === 'undefined'?"0":data[x].ventas_propias_ids;
                         var ventas_propias_total = typeof data[x].ventas_propias_total === 'undefined'?"0":data[x].ventas_propias_total;
                         var ventas_present_num = typeof data[x].ventas_present_num === 'undefined'?"0":data[x].ventas_present_num;
                         var ventas_present_total = typeof data[x].ventas_present_total === 'undefined'?"0":data[x].ventas_present_total;
                         var entrega = typeof data[x].entrega === 'undefined'?"0":data[x].entrega;
                         var bono_productividad = typeof data[x].bono_productividad === 'undefined'?"0":data[x].bono_productividad;
                         var bono_reclutadora = typeof data[x].bono_reclutadora === 'undefined'?"0":data[x].bono_reclutadora;
                         //var retencion = typeof data[x].retencion === 'undefined'?"0":data[x].retencion;
                         //var ajuste = typeof data[x].ajuste === 'undefined'?"0":data[x].ajuste;
                         //var subtotal = typeof data[x].subtotal === 'undefined'?"0":data[x].subtotal;
                         //var num_entrega = typeof data[x].num_entrega === 'undefined'?"0":data[x].num_entrega;
                         var odv_equipo = typeof data[x].odv_equipo === 'undefined'?"0":data[x].odv_equipo;
                         //var odv_rec_id = typeof data[x].odv_rec_id === 'undefined'?"0":data[x].odv_rec_id;
                         var odv_entrega = typeof data[x].odv_entrega === 'undefined'?"0":data[x].odv_entrega;
                         var total = typeof data[x].total === 'undefined'?"0":data[x].total;
                         //var tm_pagada = typeof data[x].tm_pagada === 'undefined'?"0":data[x].tm_pagada;
                         //var total_venta_propia = typeof data[x].total_venta_propia === 'undefined'?"0":data[x].total_venta_propia;
                         //var tm_pagadas_equipo = typeof data[x].tm_pagadas_equipo === 'undefined'?"0":data[x].tm_pagadas_equipo;
                         var porcentaje = typeof data[x].porcentaje === 'undefined'?"0":data[x].porcentaje;
                         var odv_de_reclutas = typeof data[x].odv_de_reclutas === 'undefined'?"0":data[x].odv_de_reclutas;
                         //var tm_pagadas_rec = typeof data[x].tm_pagadas_rec === 'undefined'?"0":data[x].tm_pagadas_rec;
                         //var bono_talento = typeof data[x].bono_talento === 'undefined'?"0":data[x].bono_talento;
                         var bono_emerald = typeof data[x].bono_emerald === 'undefined'?"0":data[x].bono_emerald;
                         //var tm_ganadas = typeof data[x].tm_ganadas === 'undefined'?"0":data[x].tm_ganadas;
                         //var acumulado_de_ventas = typeof data[x].acumulado_de_ventas === 'undefined'?"0":data[x].acumulado_de_ventas;
                         var odv_rec_del_periodo = typeof data[x].odv_rec_del_periodo === 'undefined'?"0":data[x].odv_rec_del_periodo;
                         //var rec_period_le = typeof data[x].rec_period_le === 'undefined'?"0":data[x].rec_period_le;
                         var rec_con_ventas = typeof data[x].rec_con_ventas === 'undefined'?"0":data[x].rec_con_ventas;
                         var bono_tres_dos = typeof data[x].bono_tres_dos === 'undefined'?"0":data[x].bono_tres_dos;
                         var bono_cinco_dos = typeof data[x].bono_cinco_dos === 'undefined'?"0":data[x].bono_cinco_dos;
                         var odv_pre_supercomision = typeof data[x].odv_pre_supercomision === 'undefined'?"0":data[x].odv_pre_supercomision;
                         var ventas_sc = typeof data[x].ventas_sc === 'undefined'?"0":data[x].ventas_sc;
                         var bono_sc = typeof data[x].bono_sc === 'undefined'?"0":data[x].bono_sc;
                         var nle = typeof data[x].nle === 'undefined'?"0":data[x].nle;
                         var bono_nle = typeof data[x].bono_nle === 'undefined'?"0":data[x].bono_nle;
                         var xdos_nle = typeof data[x].xdos_nle === 'undefined'?"0":data[x].xdos_nle;
                         var tresdos_nle = typeof data[x].tresdos_nle === 'undefined'?"0":data[x].tresdos_nle;
                         var cincodos_nle = typeof data[x].cincodos_nle === 'undefined'?"0":data[x].cincodos_nle;
                         var montoNR = typeof data[x].montoNR === 'undefined'?"0":data[x].montoNR;
                         var noNR = typeof data[x].noNR === 'undefined'?"0":data[x].noNR;
                         var dataNR = typeof data[x].dataNR === 'undefined'?"0":data[x].dataNR;
                         var montoActividad = typeof data[x].montoActividad === 'undefined'?"0":data[x].montoActividad;
                         var noActividad = typeof data[x].noActividad === 'undefined'?"0":data[x].noActividad;
                         var ventaPropiaTMSB = typeof data[x].ventaPropia_tmsb === 'undefined'?"0":data[x].ventaPropia_tmsb;
                         var ventaPropiaTMSB_monto = typeof data[x].ventaPropia_monto_tmsb === 'undefined'?"0":data[x].ventaPropia_monto_tmsb;
                         var productividadTMSB = typeof data[x].productividad_tmsb === 'undefined'?"0":data[x].productividad_tmsb;
                         var productividadTMSB_monto = typeof data[x].productividad_monto_tmsb === 'undefined'?"0":data[x].productividad_monto_tmsb;
                         var dataActividad = typeof data[x].dataActividad === 'undefined'?"0":data[x].dataActividad;
                         //var dataExtendido = typeof data[x].rec_extendido === 'undefined'?"0":data[x].rec_extendido;
                         //var dataExtendidoODV = typeof data[x].rec_extendidoODV === 'undefined'?"0":data[x].rec_extendidoODV;
                         xmlStr += '<Row>'
                           +'<Cell><Data ss:Type="String">'+data[x].nameEmp+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+data[x].ingreso+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+data[x].nombre_unidad+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventas_propias_num+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+tm_pagada+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventas_propias_ids+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+num_ck+'</Data></Cell>' //COOK KEY 
                               + '<Cell><Data ss:Type="String">'+total_ck+'</Data></Cell>' //COMISION COOK KEY
                               + '<Cell><Data ss:Type="String">'+num_garantia+'</Data></Cell>' //Num Garantia
                               + '<Cell><Data ss:Type="String">'+monto_garantia+'</Data></Cell>' //Monto Garantia
                               + '<Cell><Data ss:Type="String">'+ids_garantia+'</Data></Cell>' //IDS Garantia
                               //+ '<Cell><Data ss:Type="String">'+total_venta_propia+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventas_propias_total+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+tm_ganadas+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+acumulado_de_ventas+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+num_entrega+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+entrega+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+bono_productividad+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventaPropiaTMSB_monto+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+productividadTMSB_monto+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+productividadTMSB+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+bono_emerald+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+odv_de_reclutas+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+tm_pagadas_rec+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+odv_rec_id+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+bono_reclutadora+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+dataExtendido+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+dataExtendidoODV+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+bono_talento+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventas_present_num+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+tm_pagadas_equipo+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+odv_equipo+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+porcentaje+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+ventas_present_total+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+nle+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+bono_nle+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+xdos_nle+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+tresdos_nle+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+cincodos_nle+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+odv_rec_del_periodo+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+rec_period_le+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+montoNR+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+noNR+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+dataNR+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+montoActividad+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+noActividad+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+dataActividad+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+retencion+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+ajuste+'</Data></Cell>'
                               //+ '<Cell><Data ss:Type="String">'+subtotal+'</Data></Cell>'
                               + '<Cell><Data ss:Type="String">'+total+'</Data></Cell>'
                               + '</Row>';
                         
                       }
  
  
                       xmlStr += '</Table></Worksheet></Workbook>';
  
                       var strXmlEncoded = encode.convert({
                           string : xmlStr,
                           inputEncoding : encode.Encoding.UTF_8,
                           outputEncoding : encode.Encoding.BASE_64
                       });
  
                       var objXlsFile = file.create({
                           name : 'reporte_de_comisiones.xls',
                           fileType : 'EXCEL',
                           contents : strXmlEncoded,
                           folder: 1798
                       });
                       // Optional: you can choose to save it to file cabinet
                       // objXlsFile.folder = -14;
                       var intFileId = objXlsFile.save();
                       log.debug('fileTXT',intFileId);
                       //var fileValue = file.getValue();
                       log.debug('archivo generado' , 'archivo generado' );
                       
                       context.response.write(JSON.stringify({id:intFileId}));
                   }catch (err) {
                     log.error('Excel Error',err);
                  }
                 }
                 else if (context.request.method == 'GET') {
                   try{
                     var request = context.request;
                       log.debug("LogUser",request);
                         var idfile = request.parameters.idfile;
                         log.debug("idfile",idfile);
                         
                         var objXlsFile = file.load({
                             id : idfile
                         });
                         
                         log.debug("objXlsFile",objXlsFile);
                         context.response.writeFile(objXlsFile,true); 
                   }catch(err){
                     log.error("error getFile",err);
                   }
                   
               }

             }

             return {
                 onRequest : onRequest
                 
             };

         });