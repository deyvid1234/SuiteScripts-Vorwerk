 function AlarmaVentas(type,name,linenum)
 {	
 if (name == 'shipdate')
	 {
 var validar	=returnBlank(nlapiGetFieldValue('shipdate'));
 
 if (validar !='' ) // busqueda por numero de serie en Ciclo Clientes: Ventas con numeros de Series
	 {
var filters			= new Array();
// 	filters.push(new nlobjSearchFilter('serialnumbers', null, 'is', serie));
 	    	

 var resultado = returnBlank(nlapiSearchRecord(null,'customsearch664',filters,null));    

 if(resultado != '')
 {
	for(i=0;i<resultado.length;i++){
	//var factura 	= returnBlank(resultado[0].getText('billingtransaction'));
	
		var nserie  = returnBlank(resultado[i].getValue('serialnumber')); 
		if(nserie != ''){
                 var numeov  = returnBlank(resultado[i].getValue('serialnumbers')); 
		 var fechov  = returnBlank(resultado[i].getValue('trandate')); 
		 var contac  = returnBlank(resultado[i].getValue('custbodycontacto1')); 
		 var correo  = returnBlank(resultado[i].getValue('custbodycontacto3')); 
		 var telcon  = returnBlank(resultado[i].getValue('custbodycontacto4')); 
		 var telmov  = returnBlank(resultado[i].getValue('custbodycontacto5')); 
		 var domici  = returnBlank(resultado[i].getValue('custbodycontacto2'));
		 var cumple  = returnBlank(resultado[i].getValue('custbodycontacto6'));	
		 var gerent  = returnBlank(resultado[i].getValue('supervisor','SalesRep'));
		 var lidere  = returnBlank(resultado[i].getValue('salesrep'));
	//var presen  = returnBlank(resultado[0].getValue(''));
	//var fechen  = returnBlank(resultado[0].getValue(''));
	//var fatura  = returnBlank(resultado[0].getValue(''));
	//var fechfa  = returnBlank(resultado[0].getValue(''));
	
	/*
	alert (nserie);
	alert (numeov);
	alert (fechov);
	alert (contac);
	alert (correo);
	alert (telcon);
	alert (telmov);
	alert (domici);
	alert (cumple);
	alert (gerent);
	alert (lidere);*/
	
    //var objini= {"custrecord_cont_ciclo_ord":numeov};
    
		 var prueba = nlapiCreateRecord("customrecord_imr_ctrlcicloscte");
		 prueba.setFieldValue('custrecord_cont_ciclo_num', nserie);
		 prueba.setFieldValue('custrecord_cont_ciclo_ord', numeov);
		 prueba.setFieldValue('custrecord_cont_ciclo_fec', fechov);
		 prueba.setFieldValue('custrecord_cont_ciclo_con', contac);
		 prueba.setFieldValue('custrecord_cont_ciclo_cor', correo);
		 prueba.setFieldValue('custrecord_cont_ciclo_tel', telcon);
		 prueba.setFieldValue('custrecord_cont_ciclo_cel', telmov);
		 prueba.setFieldValue('custrecord_cont_ciclo_dom', domici);
		 prueba.setFieldValue('custrecord_cont_ciclo_cum', cumple);
		 prueba.setFieldValue('custrecord_cont_ciclo_ger', gerent);
		 prueba.setFieldValue('custrecord_cont_ciclo_lid', lidere);
		 var id_prueba = nlapiSubmitRecord(prueba);
                }
	}
	
	/*
    nlapiSetFieldValue('custrecord_cont_ciclo_num', nserie);
    nlapiSetFieldValue('custrecord_cont_ciclo_ord', numeov);
    nlapiSetFieldValue('custrecord_cont_ciclo_fec', fechov);
    nlapiSetFieldValue('custrecord_cont_ciclo_con', contac);
    nlapiSetFieldValue('custrecord_cont_ciclo_cor', correo);
    nlapiSetFieldValue('custrecord_cont_ciclo_tel', telcon);
    nlapiSetFieldValue('custrecord_cont_ciclo_cel', telmov);
    nlapiSetFieldValue('custrecord_cont_ciclo_dom', domici);
    nlapiSetFieldValue('custrecord_cont_ciclo_cum', cumple);
    nlapiSetFieldValue('custrecord_cont_ciclo_ger', gerent);
    nlapiSetFieldValue('custrecord_cont_ciclo_lid', lidere);
    
    nlapiSetFieldValue('custrecord_cont_ciclo_lid', presen);
    nlapiSetFieldValue('custrecord_cont_ciclo_lid', fechen);
    nlapiSetFieldValue('custrecord_cont_ciclo_lid', fatura);
    nlapiSetFieldValue('custrecord_cont_ciclo_lid', fechfa);
	*/	   
	
 } 
	 }
	 }
	 }
//------------------  Validaciones / Elimina duplicados    ---------------//
 
 function returnBlank(cad)
 {
 	return cad == null || cad== undefined?'':cad;
 }
 Array.prototype.deleteDuplicateElements=function(a)
 {	
 	return this.filter(
 		function(elm, i, array)
 			{
 				return (array.indexOf(elm, i + 1) < 0);
 			});
 		return this.filter(
 			function(elm, i, array)
 			{
 				if(this.indexOf(elm) < 0)
 				{
 					this.push(elm);
 					return true;
 	          }
 	          return false;
 	        }, []);
 };