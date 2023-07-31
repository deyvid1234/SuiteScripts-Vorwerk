/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search','N/email','N/render','N/file','./Vorwerk Dictionary Script.js'],

function(record, search, email, render, file,Dictionary) {
    var config_fields = Dictionary.getDictionayFields();

    function onRequest(context){
        try{
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
            if (context.request.method == 'POST'){
                GenerarArchivoTXT(context);
            }
        }
        catch(e){
            log.error('There is an error in onRequest',e)
        }
    }

    function GenerarArchivoTXT(context){
        try{
            var params = JSON.parse(context.request.body);
            log.debug('params',params);
            //var objRequest = JSON.parse(context.request.body);
            //log.debug('objRequest',objRequest);
            var Base64 = new MainBase64();
                //data = objRequest['data'];
                //data = Base64.decode(data);
                //data = JSON.parse(data);
            //log.debug('data',data);
            /*var recordType = returnBlank(data.recordType);
            var recordId = returnBlank(data.recordId);*/
            //Obtiene los attrs del request
            var recordType = returnBlank(params['recordType']);
            var recordId = returnBlank(params['recordId']);
            var ids_registro = params['ids'].split(',')
            log.debug('recordType',recordType);
            log.debug('recordId',recordId);
            log.debug('ids_registro',ids_registro)
            var objConsecutivo = search.lookupFields({
                type: recordType,
                id: recordId,
                columns: ['custrecord_rc_consecutivo','custrecord_nivel_jerarquia']
            });
           
            var type_emp = objConsecutivo['custrecord_nivel_jerarquia'][0]['value']
            log.debug('jerarquia',type_emp);

            //Carga el record de  Registro de Compensaciones, se cambiará por los childs de "Compensaciones: JDG"
            /*var loadedRecord = record.load({
                type: recordType, 
                id: recordId,
                isDynamic: true,
            });*/
            //log.debug('loadedRecord',loadedRecord);
            //Búsqueda a Compensaciones: JDG, trae los childs con detalles
            var objCompensation = getObjCompensation(recordId,recordType,type_emp,ids_registro);
            //var _data_txt   = returnBlank(loadedRecord.getValue('custrecord_data_txt'));
            //var _data_txt   = returnBlank(loadedRecord.getValue('custrecord_datatxt'));
            //_data_txt   = Base64.decode(_data_txt);
            //_data_txt   = JSON.parse(_data_txt);
            //log.debug('_data_txt',_data_txt);
            //var consecutivo = returnBlank(_data_txt.consecutivo);
           
            var consecutivo = (objConsecutivo['custrecord_rc_consecutivo']) ? objConsecutivo['custrecord_rc_consecutivo'] : '0001';//PENDIENTE OBTENER ESTE VALOR
            //var atotal      = returnBlank(_data_txt.atotal);
            //var adet_com    = returnBlank(_data_txt.adet_com);
            //var anum_emp    = returnBlank(_data_txt.anum_emp);//old method
            var anum_emp = Object.keys(objCompensation);
            var f = new Date();
            var a = f.getFullYear();
                a = a.toString();
                a = a.slice(2,4);
            var m = getVal(f.getMonth())+getVal(1);
            var d = f.getDate();
            if(m<10){
                m= "0"+m;
            }
            if(d<10){
                d= "0"+d;
            }
            var fecha = a + '/' + m + '/' + d;
                fecha = fecha.split('/');
                fecha = fecha.join('');
            var importe         = 0;
            
            var numcuenta       = '00000000001976034976';
            
            log.debug('anum_emp',anum_emp);
            log.debug('type',typeof(anum_emp));
            
            var busqueda = search.load({
                id: 'customsearch_empleado_data_txt_file'
            });
            
            busqueda.filters.push(search.createFilter({
                name: 'internalid',
                operator: 'anyof',
                values: anum_emp
            }));
            
            log.debug('busqueda',busqueda);
            log.debug('objCompensation 1',objCompensation);
            var objSearchResult = {};
            busqueda.run().each(function(r){
                log.debug('thisResult',r);
                /*log.debug('firstname',thisResult.getValue('firstname'));
                log.debug('custentity_tipo_cuenta',thisResult.getValue('custentity_tipo_cuenta'));*/
                objSearchResult[r.id] = {
                    internalid: r.getValue('internalid'),
                    entityid: r.getValue('entityid'),
                    firstname: r.getValue('firstname'),
                    lastname: r.getValue('lastname'),
                    tipoCuentaAux: r.getValue('custentity_tipo_cuenta'),
                    numCuentaAux: r.getValue('custentity_numcta'),
                    sucursalAux: r.getValue('custentity13'),
                    claveBanco: r.getValue('custentity_clave_banco_txt'),
                    monedero: r.getValue('custentity_es_monedero')
                };
                
                objCompensation[r.id].entityid = r.getValue('entityid'),
                objCompensation[r.id].firstname = r.getValue('firstname'),
                objCompensation[r.id].lastname = r.getValue('lastname'),
                objCompensation[r.id].tipoCuentaAux = r.getValue('custentity_tipo_cuenta'),
                objCompensation[r.id].numCuentaAux = r.getValue('custentity_numcta'),
                objCompensation[r.id].sucursalAux = r.getValue('custentity13'),
                objCompensation[r.id].claveBanco = r.getValue('custentity_clave_banco_txt'),
                objCompensation[r.id].monedero = r.getValue('custentity_es_monedero')
                
                return true;
            });
            var r3 = new String("");
            var lineasAplicadas = 0;
            
            log.debug('objCompensation 2',objCompensation);
            log.debug('objSearchResult',objSearchResult);
            
            for(idEmp in objCompensation){
                var tipoCuentaAux   = objCompensation[idEmp]['tipoCuentaAux'];
                var numCuentaAux    = objCompensation[idEmp]['numCuentaAux'];
                var sucursalAux     = objCompensation[idEmp]['sucursalAux'];
                var lastname        = objCompensation[idEmp]['lastname'];
                var firstname       = objCompensation[idEmp]['firstname'];
                var entityid        = objCompensation[idEmp]['entityid'];
                var claveBanco      = objCompensation[idEmp]['claveBanco'];
                var monedero        = objCompensation[idEmp]['monedero'];

                log.debug('Alex this is objCompensation[idEmp]',objCompensation[idEmp]);

                if(monedero == 'F' || !monedero){
                    var tipoCuenta  = '';
                    var numCuenta   = '';
                    var metodoPAgo  = '001';
                    var ceros7      = '0000000';
                    var f           = ceros7.length - getVal(fecha.toString().length);
                    var n           = ceros7.slice(0,f);
                        n           = n.concat(fecha);
                    var refPago     = n + '         ' ;
                    var registro    = returnBlank(objCompensation[idEmp]['ref']);
                    log.debug('registro',registro);
                    if(registro == '')
                    {
                        registro = '0';
                    }
                    var ref1        = getRef35(registro);
                    var ref2        = getRef35(registro);
                    var ref3        = getRef35(registro);
                    var ref4        = getRef35(registro);

                    if(tipoCuentaAux == 5)//Cheques 
                    { 
                        numCuenta = getAccount_20((sucursalAux + numCuentaAux));
                        tipoCuenta ='01';
                    }
                    if(tipoCuentaAux == 4)//Cuenta Concentradora
                    { 
                        numCuenta = getAccount_20(numCuentaAux);
                        tipoCuenta ='15';
                    }
                    if(tipoCuentaAux == 3)//Orden de Pago
                    { 
                        numCuenta = getAccount_20(numCuentaAux);
                        tipoCuenta ='04'; 
                    }
                    if(tipoCuentaAux == 2)//Plasticos
                    { 
                        numCuenta = getAccount_20(numCuentaAux);
                        tipoCuenta ='03'; 
                    }
                    if(tipoCuentaAux == 1)//CLABE solo aplica para este
                    { 
                        var bancId = numCuentaAux.substring(0,3);
                        log.debug('bancId',bancId);
                        if(bancId == '002'){
                            log.debug('Si es',bancId);
                            numCuentaAux = numCuentaAux.substring(3);
                            log.debug('numCuentaAux 2',numCuentaAux);
                        }
                        numCuenta   = getAccount_20(numCuentaAux);
                        log.debug('numCuentaAux 3',numCuentaAux);
                        if(bancId == '002'){
                            log.debug('si es 2',bancId);
                            numCuenta = numCuenta.substring(0,19);
                            log.debug('numCuentaAux 4',numCuenta);
                            var tmpSucursal = numCuenta.substring(0,4),
                                tmpCuenta = numCuenta.substring(4);
                            log.debug('tmpSucursal',tmpSucursal);
                            log.debug('tmpCuenta',tmpCuenta);
                            numCuenta = tmpSucursal+''+tmpCuenta;
                            log.debug('numCuenta con div',numCuenta);
                        }
                        tipoCuenta  = '40'; 
                        metodoPAgo  = '002';
                    }

                    var beneficiario    = getNameBen(firstname,lastname);
                    r3 += "3" + "0" + metodoPAgo + '01' + '001' + getNumber_16_2(getVal(objCompensation[idEmp]['total'])) + tipoCuenta + numCuenta + refPago + beneficiario + ref1 + ref2 + ref3 + ref4 + claveBanco + '00' + '              ' + '00000000' + '                                                                                ' + '                                                  '; 
                    r3 += String.fromCharCode(13) + String.fromCharCode(10); 
                    lineasAplicadas++;
                    importe += getVal(objCompensation[idEmp]['total']);
                    log.debug('importe',importe)
                }
            }
            /*for(var cont=0;cont<anum_emp.length;cont++){
                if(getVal(atotal[cont]) > 0){
                    var tipoCuentaAux   = objSearchResult[anum_emp[cont]]['tipoCuentaAux'];
                    var numCuentaAux    = objSearchResult[anum_emp[cont]]['numCuentaAux'];
                    var sucursalAux     = objSearchResult[anum_emp[cont]]['sucursalAux'];
                    var lastname        = objSearchResult[anum_emp[cont]]['lastname'];
                    var firstname       = objSearchResult[anum_emp[cont]]['firstname'];
                    var entityid        = objSearchResult[anum_emp[cont]]['entityid'];
                    var claveBanco      = objSearchResult[anum_emp[cont]]['claveBanco'];
                    var monedero        = objSearchResult[anum_emp[cont]]['monedero'];
                    log.debug('tipoCuentaAux',tipoCuentaAux);
                    log.debug('numCuentaAux',numCuentaAux);
                    log.debug('sucursalAux',sucursalAux);
                                        
                    if(monedero == 'F' || !monedero){
                        var tipoCuenta  = '';
                        var numCuenta   = '';
                        var metodoPAgo  = '001';
                        var ceros7      = '0000000';
                        var f           = ceros7.length - getVal(fecha.toString().length);
                        var n           = ceros7.slice(0,f);
                            n           = n.concat(fecha);
                        var refPago     = n + '         ' ;
                        var registro    = returnBlank(adet_com[cont]);
                        if(registro == '')
                        {
                            registro = '0';
                        }
                        var ref1        = getRef35(registro);
                        var ref2        = getRef35(registro);
                        var ref3        = getRef35(registro);
                        var ref4        = getRef35(registro);
                        if(tipoCuentaAux == 5)//Cheques 
                        { 
                            numCuenta = getAccount_20((sucursalAux + numCuentaAux));
                            tipoCuenta ='01';
                        }
                        if(tipoCuentaAux == 4)//Cuenta Concentradora
                        { 
                            numCuenta = getAccount_20(numCuentaAux);
                            tipoCuenta ='15';
                        }
                        if(tipoCuentaAux == 3)//Orden de Pago
                        { 
                            numCuenta = getAccount_20(numCuentaAux);
                            tipoCuenta ='04'; 
                        }
                        if(tipoCuentaAux == 2)//Plasticos
                        { 
                            numCuenta = getAccount_20(numCuentaAux);
                            tipoCuenta ='03'; 
                        }
                        if(tipoCuentaAux == 1)//CLABE 
                        { 
                            numCuenta   = getAccount_20(numCuentaAux);
                            tipoCuenta  = '40'; 
                            metodoPAgo  = '002';
                        }
                        var beneficiario    = getNameBen(firstname,lastname);
                        r3 += "3" + "0" + metodoPAgo + '01' + '001' + getNumber_16_2(getVal(atotal[cont])) + tipoCuenta + numCuenta + refPago + beneficiario + ref1 + ref2 + ref3 + ref4 + claveBanco + '00' + '              ' + '00000000' + '                                                                                ' + '                                                  '; 
                        //var x = "001" + getNumber_16_2(getVal(atotal[cont])) + tipoCuenta + numCuenta + getRef_40(adet_com[cont],1,'07') + beneficiario + getRef_40(fecha,2,'07') + "                        " + claveBanco + getRef7(fecha,cont) + "00";
                        if(cont!=anum_emp.length || anum_emp.length == 1) 
                        {
                            r3 += String.fromCharCode(13) + String.fromCharCode(10); 
                            lineasAplicadas++;
                            importe += getVal(atotal[cont]);
                        }
                    }
                }
            }*/
            if(lineasAplicadas!=0){
                importe             = getNumber_16_2(importe);
                var r1              = "1"   + "000082282802" + fecha + consecutivo + "VORWERK MEXICO S DE RL DE CV        " +  "TEST                " + "15" + "D" + "01";
                var r2              = "2"   + "1" + "001" + importe + "01" +numcuenta + getNumAbo_6(lineasAplicadas);
                var r4              = "4" + "001" + getNumAbo_6(lineasAplicadas) + importe + getNumAbo_6(1) + importe;
                var fileContents    = r1 + String.fromCharCode(13) + String.fromCharCode(10) + r2 + String.fromCharCode(13) + String.fromCharCode(10) + r3 + r4 + String.fromCharCode(13) + String.fromCharCode(10);
                var fileName        = fecha+consecutivo+".txt";
                //var file            = nlapiCreateFile(fileName, "PLAINTEXT", fileContents);
                var fileTXT = file.create({
                    name: fileName,
                    fileType: file.Type.PLAINTEXT,
                    contents: fileContents,
                    description: 'Created from VORWERK Gen TXT File.',
                    encoding: file.Encoding.UTF8,
                    folder: 241299,
                    //isOnline: true
                });
                log.debug('fileTXT',fileTXT);
                //var fileValue = file.getValue();
                log.debug('archivo generado' , 'archivo generado' );
                /*response.setContentType('PLAINTEXT', fileName, 'attachment');
                response.write(fileValue);*/
                var renderer = render.create();
                var intFileId = fileTXT.save();
                
                log.debug('fileTXT',intFileId);
                //var fileValue = file.getValue();
                log.debug('archivo generado' , 'archivo generado' );
                
                context.response.write(JSON.stringify({id:intFileId}));
                
            }
        }
        catch(e){
            log.error('There is an error in GenerarArchivoTXT',e);
            var titleImpPoliza  = 'Impresión de Compensaciones - TXT';
            var htmlError    = "<html><body>";
                htmlError   += "<br>Ha ocurrido un error, la " + titleImpPoliza + " no se realizo debido a la siguiente raz&oacute;n:";  
            var imagen = file.load({
                id: 221617
            });
            var url = imagen.url;
            var urls = url.split('&');
            var urlAux = '';
            urlAux = urls.join('&amp;');

            if ( e instanceof nlobjError ){
                htmlError       += "<br><br>Consulte a Soporte T&eacute;cnico y mueste este mensaje.";
                //htmlError         += "<br><br><a href=\"https://system.netsuite.com/core/media/media.nl?id=221617&amp;c=3367613&amp;h=20953322c7b64bde4621&amp;_xt=.pdf\">Descargar <i>Layout D</i></a>";
                    htmlError       += "<br><br><a href=\"" + urlAux + "\">Descargar <i>Layout D</i></a>";
                htmlError       += "<br><br>Puede continuar navegando en NetSuite";
                htmlError        = encodeBase64(htmlError);
                
                var params_handler_error            = new Array();
                    params_handler_error['html']    = htmlError;
                redirect.toSuitelet({
                    scriptId: 215 ,
                    deploymentId: 80,
                    parameters: {'custparam_handler_error': params_handler_error}//pendiente validar el recibo en el suitelet
                });
                log.error('redireccionado', params_handler_error);
            }
        }
    }

    function getObjCompensation(recordId,recordType,type_emp,ids_registro){
        try{
            log.debug('empleado',config_fields.empleado[type_emp])
            log.debug('_total',config_fields._total[type_emp])
            log.debug('customrecord',config_fields.customrecord[type_emp])
            var busqueda = search.create({
                type: config_fields.customrecord[type_emp],
                filters: [
                    {
                        name: config_fields.registro_compensaciones[type_emp],
                        operator: 'anyof',
                        values: recordId
                    },
                    {
                        name: 'isinactive',
                        operator: 'is',
                        values: false
                    },
                    {
                        name: config_fields._total[type_emp],
                        operator: 'greaterthan',
                        values: (type_emp != 2? 0:-1)
                    },
                    {
                        name: 'internalid',
                        operator: 'anyof',
                        values: ids_registro
                    }
                ],
                columns: [
                    { name: 'internalid' },
                    { name: config_fields.ref[type_emp]},
                    { name: config_fields.empleado[type_emp]},
                    { name: config_fields._total[type_emp]}
                ]
            });
            var objReturn = {};
            busqueda.run().each(function(r){
                log.debug('This is result childs',r);
                var employee = r.getValue(config_fields.empleado[type_emp]);
                objReturn[employee] = {
                    internalid: r.getValue('internalid'),
                    total: r.getValue(config_fields._total[type_emp]),
                    ref: r.getValue(config_fields.ref[type_emp])
                }
                return true;
            });
            return objReturn;
        }
        catch(e){
            log.error('There is an error in getObjCompensation function',e);
        }
    }

    function returnFalse(value){   
        if (value == null || value == undefined)
        {
            return 'F';
        }
        else
        {
            return value;
        }
    }

    function returnBlank(value){   
        if (value == null)
            return "";
        else 
            return value;
    }

    function getVal(value){
        var parsedValue = parseFloat(value);
        var NEN = isNaN(parsedValue);
        if (NEN == true)
        {
            return 0;
        }
        else
        {
            return parseFloat(value);
        }
    }

    function getNumber_16_2( v ){
        v = v.toFixed(2);
        var p = v.split('.');
        var ceros ='0000000000000000';
        var l = p[0].length;
        var n = ceros.slice(0,(ceros.length-l));
        n = n.concat(p[0],p[1]);
        return n;
    }

    function getAccount_20( v ){
        var ceros20 ='00000000000000000000';
        var f = ceros20.length - v.length;
        var n = ceros20.slice(0,(f));
            n = n.concat(v);
        return n;
    }

    function getRef35(v){
        v = v.toUpperCase();
        v = v.split(String.fromCharCode(32));
        v = v.join('');
        v = v.split(String.fromCharCode(164));
        v = v.join('');
        v = v.split(String.fromCharCode(165));
        v = v.join('');
        var inst ='PAGO COMPENSACION ' + v;
        var l = 35 - inst.length;
        for(var i=0;i<l;i++)
        {
            inst+=' ';
        }
        return inst;
    }

    function getRef_40( v ,opc,nat_arc){
        var n = '';
        if(returnBlank(v)!='')
        {
            if(opc==1)
            {
                //v = v.toUpperCase();
                v = v.split(String.fromCharCode(32));
                v = v.join('');
                v = v.split(String.fromCharCode(164));
                v = v.join('');
                v = v.split(String.fromCharCode(165));
                v = v.join('');
                
                var ceros = ''; //'0000000000';
                switch(nat_arc)
                {
                    case '05':
                    case '06':
                    {
                        ceros = '0000000000';
                    };break;
                    case '12':
                    {
                        ceros = '0000000';
                    };break;
                    default:
                    {
                        ceros = '0000000000';
                    };break;
                }
                var l = v.length;
                n = ceros.slice(0,(ceros.length-l));
                n = n.concat(v);
                var l2  = n.length;
                for(var i=l2;i<40;i++)
                {
                    n += ' ';
                }
                return n;
            }
            if(opc==2)
            {
                v = v.toUpperCase();
                v = v.split(String.fromCharCode(32));
                v = v.join('');
                v = v.split(String.fromCharCode(164));
                v = v.join('');
                v = v.split(String.fromCharCode(165));
                v = v.join('');
                for(var i=65;i<=90;i++)
                {
                    v = v.split(String.fromCharCode(i));
                    v = v.join('');
                }
                var inst ='PAGO COMPENSACION '+v;
                var l = 40 - inst.length;
                for(var i=0;i<l;i++)
                {
                    inst+=' ';
                }
                return inst;
            }
        }
        else
        {
            n = '                              0000000000';
            return n;
        }
    }

    function getNumAbo_6( v ){
        var ceros6 ='000000';
        var f = ceros6.length - getVal(v.toString().length);
        var n = ceros6.slice(0,f);
            n = n.concat(v);
        return n;
    }

    function getRef7( v ){
        v = v.toUpperCase();
        v = v.split(String.fromCharCode(32));
        v = v.join('');
        v = v.split(String.fromCharCode(164));
        v = v.join('');
        v = v.split(String.fromCharCode(165));
        v = v.join('');
        for(var i=65;i<=90;i++)
        {
            v = v.split(String.fromCharCode(i));
            v = v.join('');
        }
        var ceros7 ='0000000';
        var f = ceros7.length - getVal(v.toString().length);
        var n = ceros7.slice(0,f);
            n = n.concat(v);
        return n;
    }

    function getNameBen(fn,ln){
        var firstName = fn;
        var lastName  = ln;
        var lastNameAux = lastName.split(' ');
        lastName = lastNameAux[0]+'/';
        lastNameAux.reverse();
        lastNameAux.pop();
        lastNameAux.reverse();
        lastNameAux = lastNameAux.join(' ');
        lastName +=lastNameAux;
        var beneficiario = firstName +','+lastName;
        beneficiario = beneficiario.slice(0,55);
        var beneficiarioAux ='';
        if(beneficiario.length<55)
        {
            for(var i=beneficiario.length;i<55;i++) { beneficiario += String.fromCharCode(32); }
        }
        for(var i=0;i<beneficiario.length;i++)
        {
            if(beneficiario.charCodeAt(i)==44 || beneficiario.charCodeAt(i)==47 || (beneficiario.charCodeAt(i)>=65 && beneficiario.charCodeAt(i)<=90) || (beneficiario.charCodeAt(i)>=97 && beneficiario.charCodeAt(i)<=122))
            { beneficiarioAux += beneficiario.charAt(i); }
            else
            { beneficiarioAux += String.fromCharCode(32); }
        }
        return beneficiarioAux;
    }

    function encodeBase64(input){
        if(input != '')
        {
            var b64array    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var base64      = "";
            var chr1        = "";
            var chr2        = "";
            var chr3        = "";
            var enc1        = "";
            var enc2        = "";
            var enc3        = "";
            var enc4        = "";
            var i           = 0;
            do 
            {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) 
                {
                    enc3 = enc4 = 64;
                }else if (isNaN(chr3)) 
                {
                    enc4 = 64;
                }
                base64  = base64  +
                b64array.charAt(enc1) +
                b64array.charAt(enc2) +
                b64array.charAt(enc3) +
                b64array.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            }while (i < input.length);
            return base64;
        }
        else
        {
            return '';
        }
    }

    function decodeBase64(input){
        if(input != '')
        {
            var b64array    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output      = "";
            var chr1        = "";
            var chr2        = "";
            var chr3        = "";
            var enc1        = "";
            var enc2        = "";
            var enc3        = "";
            var enc4        = "";
            var i           = 0;
            
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            do 
            {
                enc1 = b64array.indexOf(input.charAt(i++));
                enc2 = b64array.indexOf(input.charAt(i++));
                enc3 = b64array.indexOf(input.charAt(i++));
                enc4 = b64array.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 != 64) 
                {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) 
                {
                    output = output + String.fromCharCode(chr3);
                }
                chr1        = "";
                chr2        = "";
                chr3        = "";
                enc1        = "";
                enc2        = "";
                enc3        = "";
                enc4        = "";
            } while (i < input.length);
            return output;
        }
        else
        {
            return '';
        }
    }

    function returnNumber(value){
        var parsedValue = parseFloat(value);
        var NEN         = isNaN(parsedValue);
        if (NEN == true)
        {
            return 0;
        }
        else
        {
            return parseFloat(value);
        }
    }

    function stringToArray(str,base,opc){
        if(returnBlank(str) != '')
        {
            var multiSelectStringArray = str.split(String.fromCharCode(base));
            return multiSelectStringArray;
        }
        else
        {
            switch(opc)
            {
                case 0:
                {
                    return null;
                };break;
                case 1:
                {
                    return '';
                };break;
                
                default:
                {
                    return new Array();
                };break;
            }  
        }
    }    

    function MainBase64(){
        var Base64 = new Object();
            Base64 =
            {
                _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                encode  : function (input) 
                {
                    var output  = "";
                    var chr1    = "";
                    var chr2    = "";
                    var chr3    = "";
                    var enc1    = "";
                    var enc2    = "";
                    var enc3    = "";
                    var enc4    = "";
                    var i       = 0;
                    input       = Base64._utf8_encode(input);
                    while (i < input.length) 
                    {
                        chr1 = input.charCodeAt(i++);
                        chr2 = input.charCodeAt(i++);
                        chr3 = input.charCodeAt(i++);
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;
                        if (isNaN(chr2)) 
                        {
                            enc3 = enc4 = 64;
                        }
                        else if (isNaN(chr3)) 
                        {
                            enc4 = 64;
                        }
                        output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
                    }
                    return output;
                },
                decode  : function (input) 
                {
                    var output  = "";
                    var chr1    = "";
                    var chr2    = "";
                    var chr3    = "";
                    var enc1    = "";
                    var enc2    = "";
                    var enc3    = "";
                    var enc4    = "";
                    var i       = 0;
                    input       = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                    while (i < input.length) 
                    {
                        enc1    = this._keyStr.indexOf(input.charAt(i++));
                        enc2    = this._keyStr.indexOf(input.charAt(i++));
                        enc3    = this._keyStr.indexOf(input.charAt(i++));
                        enc4    = this._keyStr.indexOf(input.charAt(i++));
                        chr1    = (enc1 << 2) | (enc2 >> 4);
                        chr2    = ((enc2 & 15) << 4) | (enc3 >> 2);
                        chr3    = ((enc3 & 3) << 6) | enc4;
                        output  = output + String.fromCharCode(chr1);
                        if (enc3 != 64) 
                        {
                            output = output + String.fromCharCode(chr2);
                        }
                        if (enc4 != 64) 
                        {
                            output = output + String.fromCharCode(chr3);
                        }
                    }
                    output = Base64._utf8_decode(output);
                    return output;
                },
                _utf8_encode : function (string) 
                {
                    string      = string.replace(/\r\n/g,"\n");
                    var utftext = "";
                    for (var n = 0; n < string.length; n++) 
                    {
                        var c = string.charCodeAt(n);
                        if (c < 128) 
                        {
                            utftext += String.fromCharCode(c);
                        }
                        else if((c > 127) && (c < 2048))
                        {
                            utftext += String.fromCharCode((c >> 6) | 192);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }
                        else 
                        {
                            utftext += String.fromCharCode((c >> 12) | 224);
                            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                            utftext += String.fromCharCode((c & 63) | 128);
                        }
                    }
                    return utftext;
                },
                _utf8_decode : function (utftext) 
                {
                    var string  = "";
                    var i       = 0;
                    var c       = 0;
                    var c2      = 0;
                    while ( i < utftext.length ) 
                    {
                        c = utftext.charCodeAt(i);
                        if (c < 128) 
                        {
                            string += String.fromCharCode(c);
                            i++;
                        }
                        else if((c > 191) && (c < 224)) 
                        {
                            c2       = utftext.charCodeAt(i+1);
                            string  += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                            i       += 2;
                        }
                        else 
                        {
                            c2       = utftext.charCodeAt(i+1);
                            c3       = utftext.charCodeAt(i+2);
                            string  += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                            i       += 3;
                        }
                    }
                    return string;
                }
            };
        return Base64;
    }

    return {
        onRequest: onRequest,
        GenerarArchivoTXT:GenerarArchivoTXT
    };
});

