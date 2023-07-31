/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/file', 'N/encode', 'N/email' ],

function(file, encode, email) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {

        if (context.request.method == 'POST') {
          try{
        	  var request = context.request;
              var body = JSON.parse(context.request.body);
              var data=body.data;
              var header = body.head;
              log.debug('data',data);
              log.debug('header',header);

              var type = body.type;

              if(type=='EXCEL')
              {
                var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';


                xmlStr += '<Worksheet ss:Name="Sheet1">';
                xmlStr += '<Table>'
                        + '<Row>';
                        for(var x in header){
                            xmlStr +=  '<Cell><Data ss:Type="String">'+header[x]+'</Data></Cell>';
                        }
                xmlStr += '</Row>';
                
                for(var x = 0; x< data.length; x++ ){
                    xmlStr += '<Row>';
                        for(var y in data[x]){
                            
                            if(data[x][y] != ""){
                                
                                xmlStr += '<Cell><Data ss:Type="String">'+data[x][y]+'</Data></Cell>';
                                    
                            }else{
                                xmlStr += '<Cell><Data ss:Type="String"></Data></Cell>';
                            }
                        }
                        xmlStr += '</Row>';
                }


                xmlStr += '</Table></Worksheet></Workbook>';

                var strXmlEncoded = encode.convert({
                    string : xmlStr,
                    inputEncoding : encode.Encoding.UTF_8,
                    outputEncoding : encode.Encoding.BASE_64
                });

                var objXlsFile = file.create({
                    name : 'MX_Daily_sales_VI.xls',
                    fileType : file.Type.EXCEL,
                    contents : strXmlEncoded,
                    folder: 384956
                });
              }
              else if(type == 'CSV')
              {
                var str = "";
                for(var x in header){
                    str +=  header[x]+';';
                }
                for(var x = 0; x< data.length; x++ ){
                    str += '\r\n';
                        for(var y in data[x]){
                            if(data[x][y]!='')
                                str +=data[x][y]+';';
                            else
                                str +=';';
                        }       
                }
                var objXlsFile = file.create({
                    name : 'MX_Daily_sales_VI.csv',
                    fileType : file.Type.CSV,
                    contents : str,
                    folder: 384956
                });
              }
              var intFileId = objXlsFile.save();
              log.debug('fileTXT',intFileId);
              //var fileValue = file.getValue();
              log.debug('archivo generado' , 'archivo generado' );
              try{


        		email.send({
            		author: '344096',
        			recipients: 'pilar.torres@thermomix.mx',
                    cc: ['deyvid8uriel@gmail.com','pilar.torres@thermomix.mx'],
        			subject: 'MX_Daily_sales_VI',
        			body: 'Reporte Tagetik',
                    attachments: [objXlsFile]
        		}); 
            }catch(e){
                log.error("Email error",e)
            }
              context.response.write(JSON.stringify({id:intFileId}));
          }catch(e){
          	log.error("err",e)
          }
       }
    }
        

    return {
        onRequest: onRequest
    };
    
});
