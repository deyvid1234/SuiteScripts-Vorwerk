/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// This sample shows how to render search results into a PDF file.
// Note that this sample is a Suitelet, so it cannot be run in the debugger.
define(['N/runtime','N/email','N/record','N/render', 'N/search','N/xml','N/config','N/file','N/url','SuiteScripts/Vorwerk_project/Vorwerk Utils.js','SuiteScripts/Vorwerk_project/Vorwerk Dictionary Script.js','SuiteScripts/Vorwerk_project/Vorwerk Utils V2.js'],
function(runtime,email,record,render,search,xml,config,file,url,Utils,Dictionary,Util) {
  var config_fields = Dictionary.getDictionayFields();

function onRequest(context){
  	try{
  		var request = context.request;
	    var response = context.response;
	    var params = context.request.parameters;

	    var massive = params.massive
	    //log.debug('massive',massive)
	    log.debug('params',params)
	    var tmp_emp = search.lookupFields({
	                  type: 'employee',
	                  id: params.employee,
	                  columns: ['employeetype','custentity123','custentity_promocion', 'custentity_club']//custentity123 en compensaciones de ingreso
	              });
	    //log.debug('tmp_emp',tmp_emp);
	    var period_name = search.lookupFields({
	                  type: 'customrecord_periods',
	                  id: params.periodo,
	                  columns: 'name'
	              });
	    //log.debug('period_name',period_name.name);
	    var type_emp = params.level;
	    var tipoTexto = '';
	    var promoTMPrestamo = tmp_emp.custentity_promocion[0].value;
	    switch(type_emp){
	    	case '1':{
	    		var type_emp_text = 'Presentadora'
	    		var promocion = 2
	    		break;
	    	}
	    	case '2':{
	    		var type_emp_text = 'Gana tu TM'
	    		var promocion = 1
	    		break;
	    	}
	    	case '3':{
	    		var type_emp_text = 'Lider de Equipo'
	    		var promocion = 2
	    		break;
	    	}
	    }
	    if(promoTMPrestamo==5){
	    	var type_emp_text = 'TM en Prestamo'
	    }

	    //log.debug('type_emp_text',type_emp_text)
	    var conf_emp = tmp_emp.custentity123[0].value;
	    
	    //log.debug('promocion',promocion)
	    var c_record = search_crecord(params.comp,type_emp,promocion)
      
      	var dataSO = salesOrdersTP(params.periodo)   
	    var CompConfigDetails = Utils.getObjCompConfigDetails()
	    //log.debug('CompConfigDetails',CompConfigDetails)
	    var xml= "";
	      	xml  = "<?xml version='1.0' encoding='UTF-8'?>\n<!DOCTYPE pdf PUBLIC '-//big.faceless.org//report' 'report-1.1.dtd'>\n";
	  		xml += "<pdf>";
	  			xml += "<head>";
	  				xml += "<macrolist>";
	  					xml += "<macro id=\"paginas\">";
	  						xml += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"right\">Página <pagenumber/> de <totalpages/></p>";
	  					xml += "</macro>";
	  				xml += "</macrolist>";
	  			xml += "</head>";
	  			xml += "<body font='helvetica' font-size='6' footer=\"paginas\" footer-height='2'>";
	  				xml += createTable(c_record,CompConfigDetails,type_emp_text,period_name.name,type_emp,conf_emp,promocion,params.periodo,tmp_emp,dataSO);
	  			xml += "</body>\n";
	  		xml += "</pdf>";
  		 
  		try {
  			var fileR = render.xmlToPdf({
				xmlString: xml
			});

  		}catch(e){
  			log.debug("error render", e)
  		}
  		
  		if(massive == "true-pdf"){
  			
  			context.response.addHeader({
  		     	name: 'Content-Type',
  		    	 value: 'application/pdf'
  			});
  		  	var renderer = render.create();
  			renderer.templateContent = fileR.getContents();
  			log.debug('fileR',fileR)
  			log.debug('renderer.templateContent',renderer.templateContent)
  			log.debug('renderer',renderer)		    			
  			context.response.write(renderer.templateContent);
  		}else if(massive == "true"){
  			fileR.folder = 1798;
	        fileR.name = c_record.emleado+'.pdf'
	        var my_file = fileR.save();
	  		
	        log.debug('my_file',my_file)
          if(type_emp == 3){
	            type_search = "customrecord_compensaciones_jdg"
	        }else if(type_emp == 2){
	            type_search = "customrecord_compensaciones_gtm"
	        }else{
	            type_search = "customrecord_comisiones_presentadora"
	        }
	        var reg = record.load({
	            type:  type_search,
	            id: params.comp,
	            isDynamic: false
	        });

	        var compensacionesPdf = reg.setValue({ fieldId: 'custrecord_registro_pdf', value: my_file })
	        reg.save()
	        context.response.write(JSON.stringify(my_file));
  		}else{
  			context.response.addHeader({
			    name: 'Content-Type',
			    value: 'application/pdf'
			});
			var renderer = render.create();
			renderer.templateContent = fileR.getContents();
			context.response.write(renderer.templateContent);
  		}
		 
		return true;
  	}catch(err){
  		log.error("err onRequest",err)
  	}   
}//Fin Onrequest
function salesOrdersTP(cust_period){
  	try{

  		const fechaPeriodoCalculado = search.lookupFields({ type: 'customrecord_periods', id: cust_period, columns: ['custrecord_inicio','custrecord_final','name']});
      	const namePeriodo= fechaPeriodoCalculado.name //mm/yyyy
      	const inicioPeriodo = fechaPeriodoCalculado.custrecord_inicio // dd/mm/yyyy
      	const finPeriodo = fechaPeriodoCalculado.custrecord_final // dd/mm/yyyy
  		const inicioPeriodoDate =  Util.stringToDate(inicioPeriodo)
      	const finPeriodoDate = Util.stringToDate(finPeriodo)
      
      	var objSObyEmp = {};
      	var objSObyid = [];
      	const salesOrderSearchFilters = [
          	['item', 'anyof', '2638','2280','2001','2571','2170','1757','1126','2035','2402','2490'],
          	'AND',
          	['salesrep.isinactive', 'is', 'F'],
          	'AND',
          	['type', 'anyof', 'SalesOrd'],
          	'AND',
          	['formulatext: {salesrep}', 'isnotempty', ''],
          	'AND',
          	['salesrep.custentity_estructura_virtual', 'is', 'F'],
          	'AND',
          	['custbody_tipo_venta', 'anyof', '2', '19', '1'],
      	];

      	const salesOrderSearchColSalesRep = search.createColumn({ name: 'salesrep' });
      	const salesOrderSearchColTranId = search.createColumn({ name: 'tranid' });
      	const salesOrderSearchColInternalId = search.createColumn({ name: 'internalid' });
      	const salesOrderSearchColTranDate = search.createColumn({ name: 'trandate' });
      	const salesOrderSearchColItem = search.createColumn({ name: 'item' });
      	const salesOrderSearchColentity = search.createColumn({ name: 'entity' });
      	const salesOrderSearchcustipo_venta = search.createColumn({ name: 'custbody_tipo_venta' });
      	const salesOrderSearchColSalesRepLider = search.createColumn({ name: 'supervisor', join: 'salesrep' });
      	const searchSalesGar = search.create({
          	type: 'salesorder',
          	filters: salesOrderSearchFilters,
          	columns: [
              	salesOrderSearchColSalesRep,
              	salesOrderSearchColTranId,
              	salesOrderSearchColInternalId,
              	salesOrderSearchColTranDate,
              	salesOrderSearchColItem,
              	salesOrderSearchColentity,
              	salesOrderSearchcustipo_venta,
              	salesOrderSearchColSalesRepLider
             
          	],
      	});
      	searchSalesGar.filters.push(search.createFilter({
            name: 'trandate',
            operator: 'within',
            values: [Util.dateToString(inicioPeriodoDate),Util.dateToString(finPeriodoDate)]
      	}));
      	var pagedResults = searchSalesGar.runPaged();
      	pagedResults.pageRanges.forEach(function (pageRange){
         	var currentPage = pagedResults.fetch({index: pageRange.index});
         	currentPage.data.forEach(function (r) {
              	var dataSO = r.getAllValues()
              	var salrep = r.getValue('salesrep')
              	var internalID = r.getValue('internalid')
                var liderSalesRep = r.getValue({ name: 'supervisor', join: 'salesrep' })

              	if(salrep in objSObyEmp){
               	 	objSObyEmp[salrep].push(dataSO);
              	}else{
                	objSObyEmp[salrep]= [dataSO]; 
              	}
              	objSObyid[internalID] = dataSO
         	});

      	});
      	return {objSObyid:objSObyid,objSObyEmp:objSObyEmp}
	}catch(e){
	    log.error('error busqueda SO',e)
	}
}

function table_v_propia(data,tmp_emp,type_emp,promocion,dataSO,CompConfigDetails){
	try{
		var odv_p = data.odv_entrega.split(',')
		var odv_p_monto = data.venta_propia
  		//log.debug('odv_p',odv_p)
		//log.debug('dataSO',dataSO)

		var objSObyid = dataSO.objSObyid
			
		var strTable = ''
			strTable += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS PROPIAS</b></p>";
			strTable += "<table width='670px'>";
			strTable += "<tr>";
			strTable += "<td border='0.5' width='10px'><b>#</b></td>";
			strTable += "<td border='0.5' width='100px'><b>VENTA REALIZADA POR</b></td>";
			strTable += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
			strTable += "<td border='0.5' width='0px'><b>FECHA</b></td>";
			strTable += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
			strTable += "<td border='0.5' width='40px'><b>MONTO</b></td>";
			strTable += "<td border='0.5' width='0px'><b>PRODUCTIVIDAD</b></td>";
			//strTable += "<td border='0.5' width='0px'><b>ENTREGA</b></td>";
			strTable += "</tr>";
			/*fin encabezado de tabla
			cuerpo de tabla*/
			var lineaRec = 0
			for(var i in odv_p){				
				var thisSO = objSObyid[odv_p[i]]
				//log.debug('test extraccion',thisSO.salesrep[0].text)
				var monto
				if(type_emp == 1 && promocion == 1){
					monto = "$0.00"
				}else{
					monto = "$2,500.00"
				}

				lineaRec++
				var b_produc
				if(promocion == 1){
					b_produc = 0
				}else{
					b_produc = (CompConfigDetails['1']['esquemaVentasPresentadora'][lineaRec]['bonoProductividad'])-(CompConfigDetails['1']['esquemaVentasPresentadora'][lineaRec-1]['bonoProductividad'])

				}
				//& 
				var cliente = thisSO.entity[0].text.replace(/&/gi," ")
				
				strTable += "<tr>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";	
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + thisSO.salesrep[0].text 	+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + cliente	+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + thisSO.trandate 		+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + thisSO.tranid		+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + monto	+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',(b_produc)+'.00')+ "</td>";
				strTable += "</tr>";
			}
			
			strTable += "<tr>";
			strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Subtotal</b></td>";
			strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',(data.venta_propia)+'.00')	+ "</b></td>";
			strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',(data.productividad)+'.00')	+ "</b></td>";
			//strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',(data.entrega_monto)+'.00')	+ "</b></td>";
			strTable += "</tr>";			
			strTable += "</table>";
			/*cuerpo de tabla*/
			return strTable
			//fin tabla
		}catch(errT1){
			return "";	
			log.error('errT1',errT1);
		}
  }

  function table_v_equipo(data,dataSO,CompConfigDetails){
  	try{
  		log.debug('entramos')
  		var strTable = ''
  		//Ventas Equipo
	  	var equipoMonto = data.comision_equipo
	  	log.debug('equipoMonto',equipoMonto)
	    var dataEquipo = data.equipo
	    log.debug('dataEquipo',dataEquipo)
	    var ventaPropia = []
	    if(data.odvNle != ''){//si hay data en el campo odv NLE
	    	var dataNle = JSON.parse(data.odvNle)
		    var keyNle = Object.keys(dataNle)
		    
		    for (x in keyNle){
		    	var ventaPropiaN = dataNle[keyNle[x]].ventaPropia
		    	for (n in ventaPropiaN){
		    		ventaPropia.push(ventaPropiaN[n])
		    	}
		    	
		    	log.debug('ventaPropiaN',ventaPropiaN)
		    	
		    	var ventasEquipo = dataNle[keyNle[x]].dataEquipo
		    	log.debug('ventasEquipo',ventasEquipo)
		    	for (y in ventasEquipo){
		    		var odv = ventasEquipo[y]
		    		log.debug('odv',odv)
		    		for(e in odv){
		    			ventaPropia.push(parseInt(odv[e]))
		    		}
		    		
		    	}
		    	log.debug('ventaPropia en for',ventaPropia)
		    }

		    log.debug('ventaPropia final',ventaPropia)
		    log.debug('dataNle',keyNle )
	    }
	    
	    var ids = []
    	var arregloVentas= JSON.parse(dataEquipo)
    	log.debug('arregloVentas',arregloVentas)
    	if(dataEquipo != ""){
    	    for (i in arregloVentas){
    	        for(e in arregloVentas[i]){
    	        	ids.push(arregloVentas[i][e])
    	        }
    	    }
    	}
    	//log.debug('ids',ids)
		strTable += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DEL EQUIPO</b></p>";
		strTable += "<table width='670px'>";
		strTable += "<tr>";
		strTable += "<td border='0.5' width='10px'><b>#</b></td>";		
		strTable += "<td border='0.5' width='0px'><b>LIDER DE EQUIPO</b></td>";
		strTable += "<td border='0.5' width='0px'><b>VENTA REALIZADA POR</b></td>";
		strTable += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
		strTable += "<td border='0.5' width='0px'><b>FECHA</b></td>";
		strTable += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
		strTable += "</tr>";
		lineaRec=0

		for(var i in ids){//llena la tabla venta eqipo con ventas equipo de la LM
			try{
				lineaRec++
				var objSObyid = dataSO.objSObyid
				var thisSO = objSObyid[ids[i]]
				var lider = data.lider
				log.debug('lider',lider)
				var salesRep = thisSO.salesrep[0].text
				var cliente = thisSO.entity[0].text
				var fecha = thisSO.trandate
				var pedido = thisSO.tranid
				
				cliente = cliente.replace(/&/gi," ")
				strTable += "<tr>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + lider 	+ "</td>";		
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + salesRep 	+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + cliente	    + "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + fecha 		+ "</td>";
				strTable += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";		
				strTable += "</tr>";
			}catch(errT2){
				log.error('errT2 vequipo',errT2);
			}
					
		}
		if(ventaPropia != ''){//llena la tabla con las ventas esquipo del lH y sus ventas propias
			for(var i in ventaPropia){
				try{
					lineaRec++
					var objSObyid = dataSO.objSObyid
					var thisSO = objSObyid[ventaPropia[i]]
					//var lider = data.lider
					log.debug('thisSO',thisSO)
					log.debug('supervisor de nle',thisSO['salesrep.supervisor'])
					log.debug('supervisor de nle 2',thisSO['salesrep.supervisor'][0])
					if(thisSO['salesrep.supervisor']!= ''){
						var lider = thisSO['salesrep.supervisor'][0].text
					} else{
						var lider = thisSO.salesrep[0].text
					}

					log.debug('lider',lider)
					var salesRep = thisSO.salesrep[0].text
					var cliente = thisSO.entity[0].text
					var fecha = thisSO.trandate
					var pedido = thisSO.tranid
					
					cliente = cliente.replace(/&/gi," ")
					strTable += "<tr>";
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + lider 	+ "</td>";		
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + salesRep 	+ "</td>";
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + cliente	    + "</td>";
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + fecha 		+ "</td>";
					strTable += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";		
					strTable += "</tr>";
				}catch(errT2){
					log.error('errT2 vnle',errT2);
				}
						
			}
		}
				
		
		
		var porcentaje
		var odv_p = data.odv_entrega.split(',')
	
		for ( i in CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'] ){
			var desde = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['desde']
			var hasta = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['hasta']
			if (odv_p.length >= desde && odv_p.length <= hasta){
				porcentaje = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['porcentaje']
				break;
			}
		}
		var com_aux = data.comision_equipo==0?0:currencyFormat('$',data.comision_equipo/(parseInt(porcentaje)/100)+'.00')
				
		strTable += "<tr>";
		strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>   </b></td>";
		strTable += "</tr>";
		strTable += "<tr>";
		strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Total comisión Venta de Equipos</b></td>";
		strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + com_aux	+ "</b></td>";
		strTable += "</tr>";
		strTable += "<tr>";
		strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b> % Pagado </b></td>";
		strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + porcentaje	+ "</b></td>";
		strTable += "</tr>";
		strTable += "<tr>";
		strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Total comisión</b></td>";
		strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',data.comision_equipo+'.00')	+ "</b></td>";
		strTable += "</tr>";
		strTable += "</table>";
		//Fin Ventas Equipo

		return strTable
  	}catch(e){
  		log.debug('error funcion venta equipo',e)
  	}
  	
  }
  function table_v_rec(data,dataSO,CompConfigDetails){
  	//Ventas Rec
	try{
		var strTable = ''
		var reclutas = Object.keys(JSON.parse(data.rec))
		var conf_rec = []
	    var conf_equipo = []
            
		if(data.b_rec != ''&& data.b_rec != null && data.b_rec && data.b_rec > 0 && data.rec != "" && data.rec){
			strTable    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>BONO DE RECLUTAMIENTO</b></p>";
			strTable += "<table width='670px'>";
			strTable += "<tr>";
			strTable += "<td border='0.5' width='10px'><b>#</b></td>";
			strTable += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
			strTable += "<td border='0.5' width='0px'><b>VENTA REALIZADA POR</b></td>";
			strTable += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
			strTable += "<td border='0.5' width='0px'><b>FECHA</b></td>";
			strTable += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
			strTable += "<td border='0.5' width='0px'><b>MONTO</b></td>";
			strTable += "</tr>";
			lineaRec=0
				
			ids_rec = JSON.parse(data.rec)
			log.debug("ids_rec", ids_rec)
			for(var i in ids_rec){
				for(x in ids_rec[i]){
					var idSO = ids_rec[i][x].idSO
					var noVenta = ids_rec[i][x].noVenta
					var objSObyid = dataSO.objSObyid
					var thisSO = objSObyid[idSO]
					var salesRep = thisSO.salesrep[0].value
					var cliente = thisSO.entity[0].text
					var fecha = thisSO.trandate
					var pedido = thisSO.tranid
					var confRec = []
					/*log.debug('idSO',idSO)
					log.debug('noVenta',noVenta)
					log.debug('salesRep',salesRep)*/

					var busquedaConfRec = search.create({
						type: 'employee',
						columns: [
							{ name: 'custentity_conf_rec'},
							{ name: 'custentity123'},         
						],
						filters: [
							{
							    name: 'internalid',
							    operator: 'anyof',
							    values: salesRep
							 }
						]
				    });
					var pagedResults = busquedaConfRec.runPaged();
						pagedResults.pageRanges.forEach(function (pageRange){
						    var currentPage = pagedResults.fetch({index: pageRange.index});
						        currentPage.data.forEach(function (r) {
								    confR = r.getValue('custentity_conf_rec'),
								    confIng = r.getValue('custentity123')	
								    //log.debug('confIng',confIng)
								    confRec.push(confR)

								    var confv_rec = confIng.split(',')
						   			var nameConfEquipo
									for(var n in confv_rec ){
						                switch(confv_rec[n]){
							                case '1':
							                  nameConfEquipo = 'Promocion Base'
							                  break;
							                case '5': 
							                  nameConfEquipo = 'Thermomix 6'
							                  break;
							                case '6': 
							                  nameConfEquipo = 'Emerald Club'
							                  break;
							                case '7': 
							                  nameConfEquipo = 'LE Junior'
							                  break;
							                case '8': 
							                  nameConfEquipo = 'NLE Emerald'
							                  break;
							                case '11': 
							                  nameConfEquipo = 'TM6 Rectificada'
							                    
							                  break;
							                case '12': 
							                  nameConfEquipo = 'TM4U'
							                   
							                  break;
							                  case '13': 
						                  nameConfEquipo = 'TM6 4 ventas 2 meses'
						                   
						                  break;
						                }
						            }
								      conf_equipo.push(nameConfEquipo)									  	  		
								});
					    });
						//log.debug('cc',confRec)
				            
				        if(!confRec){
				            confRec = 1
				        }
							cliente = cliente.replace(/&/gi," ")
							//log.debug('cliente',cliente)
							//log.debug('1ids_rec[v_rec[i].internalid]',ids_rec[v_rec[i].internalid])
							var monto_rec = CompConfigDetails[confRec]['esquemaVentasReclutamiento'][noVenta]['compensacion']
							log.debug('monto_rec',monto_rec)
							if(monto_rec>0){
								strTable += "<tr>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" + conf_equipo 	+ "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" + salesRep 	+ "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" +  cliente	    + "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" + fecha 		+ "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow'>" + pedido		+ "</td>";
								strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',monto_rec >0? monto_rec : '0.00')	+ "</td>";
								strTable += "</tr>";	
							}
				}	
					
			}
				
			strTable += "<tr>";
			strTable += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
			strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',data.b_rec+'.00' )+ "</b></td>";
			strTable += "</tr>";
			strTable += "</table>";
		}
		return strTable
	}catch(errT3){
		log.error('errT3',errT3);
	}
			//Fin Ventas Rec
  }

function table_b_Permanente (data){
  	try{
  		var strTable = ''
	    var obj_bonos = {
		    bono1: {label:(data.bono_1 != '' && data.bono_1 != null? data.bono_1 : "Bono Permanente 1"),valor:(data.bono_m_1 != '' ? data.bono_m_1+'.00' : "0.00")},
		    bono2: {label:(data.bono_2 != '' && data.bono_2 != null? data.bono_2 : "Bono Permanente 2"),valor:(data.bono_m_2 != '' ? data.bono_m_2+'.00' : "0.00")},
		    bono3: {label:(data.bono_3 != '' && data.bono_3 != null? data.bono_3 : "Bono Permanente 3"),valor:(data.bono_m_3 != '' ? data.bono_m_3+'.00' : "0.00")},
		    bono4: {label:(data.bono_4 != '' && data.bono_4 != null? data.bono_4 : "Bono Permanente 4"),valor:(data.bono_m_4 != '' ? data.bono_m_4+'.00' : "0.00")},
		    bono5: {label:(data.bono_5 != '' && data.bono_5 != null? data.bono_5 : "Bono Permanente 5"),valor:(data.bono_m_5 != '' ? data.bono_m_5+'.00' : "0.00")},
		    bono6: {label:(data.bono_6 != '' && data.bono_6 != null? data.bono_6 : "Bono Permanente 6"),valor:(data.bono_m_6 != '' ? data.bono_m_6+'.00' : "0.00")},
		    bono7: {label:(data.bono_7 != '' && data.bono_7 != null? data.bono_7 : "Bono Permanente 7"),valor:(data.bono_m_7 != '' ? data.bono_m_7+'.00' : "0.00")},
		    bono8: {label:(data.bono_8 != '' && data.bono_8 != null? data.bono_8 : "Bono Permanente 8"),valor:(data.bono_m_8 != '' ? data.bono_m_8+'.00' : "0.00")},
		    bono9: {label:(data.bono_9 != '' && data.bono_9 != null? "Bono Permanente 9" : "Bono Permanente 9"),valor:(data.bono_m_9 != '' ? data.bono_m_9+'.00' : "0.00")},
		    bono10: {label:(data.bono_10 != '' && data.bono_10 != null? data.bono_10 : "Bono Permanente 10"),valor:(data.bono_m_10 != '' ? data.bono_m_10+'.00' : "0.00")},
		    bonoTotal: parseInt(data.bono_m_1 != '' ? data.bono_m_1 : 0)+parseInt(data.bono_m_2 != '' ? data.bono_m_2 : 0)+parseInt(data.bono_m_3 != '' ? data.bono_m_3 : 0)+parseInt(data.bono_m_4 != '' ? data.bono_m_4 : 0)+parseInt(data.bono_m_5 != '' ? data.bono_m_5 : 0)+parseInt(data.bono_m_6 != '' ? data.bono_m_6 : 0)+parseInt(data.bono_m_7 != '' ? data.bono_m_7 : 0)+parseInt(data.bono_m_8 != '' ? data.bono_m_8 : 0)+parseInt(data.bono_m_9 != '' ? data.bono_m_9 : 0)+parseInt(data.bono_m_10 != '' ? data.bono_m_10 : 0)
	    }
			
		//log.debug('data.total',data.total)
		strTable +="<br/><h3 align='center'>Bonos Permanentes</h3>";
	    strTable += "<table width='670px' page-break-inside='avoid'>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono1.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono2.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono3.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono4.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono5.label) + "</b></td>";
	    strTable += "</tr>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', obj_bonos.bono1.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono2.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono3.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono4.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono5.valor) + "</td>";
	    strTable += "</tr>";
	    strTable += "</table>";

	    strTable +="<br/>";
	    strTable += "<table width='670px' >";
	    strTable += "<tr>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono6.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono7.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono8.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono9.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono10.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>Total <br/>Bonos Permanentes</b></td>";
	    strTable += "</tr>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono6.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono7.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono8.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono9.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos.bono10.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(obj_bonos.bonoTotal+'.00')) +"</td>";
	    strTable += "</tr>";
	    strTable += "</table>";
	    //fin bonos permanentes
	    
	    return {strTable:strTable, bPermanenteTotal:obj_bonos.bonoTotal}
  	}catch(e){
  		log.error('error bonos permanentes',e)
  	}
  	
}

function table_b_Manual(data){
	try{
		var strTable = ''
	  	//log.debug('data.total',data.total)
	  	var obj_bonos_manuales = {
	      	bonoManual1: {label:(data.bonoMan_1 != '' && data.bonoMan_1 != null? data.bonoMan_1 : "Bono Manual 1"),valor:(data.bonoMan_m_1 != '' ? data.bonoMan_m_1+'.00' : "0.00")},
	      	bonoManual2: {label:(data.bonoMan_2 != '' && data.bonoMan_2 != null? data.bonoMan_2 : "Bono Manual 2"),valor:(data.bonoMan_m_2 != '' ? data.bonoMan_m_2+'.00' : "0.00")},
	     	bonoManual3: {label:(data.bonoMan_3 != '' && data.bonoMan_3 != null? data.bonoMan_3 : "Bono Manual 3"),valor:(data.bonoMan_m_3 != '' ? data.bonoMan_m_3+'.00' : "0.00")},
	     	bonoManual4: {label:(data.bonoMan_4 != '' && data.bonoMan_4 != null? data.bonoMan_4 : "Bono Manual 4"),valor:(data.bonoMan_m_4 != '' ? data.bonoMan_m_4+'.00' : "0.00")},
	      	bonoManual5: {label:(data.bonoMan_5 != '' && data.bonoMan_5 != null? data.bonoMan_5 : "Bono Manual 5"),valor:(data.bonoMan_m_5 != '' ? data.bonoMan_m_5+'.00' : "0.00")},
	      	bonoManual6: {label:(data.bonoMan_6 != '' && data.bonoMan_6 != null? data.bonoMan_6 : "Bono Manual 6"),valor:(data.bonoMan_m_6 != '' ? data.bonoMan_m_6+'.00' : "0.00")},
	      	bonoManual7: {label:(data.bonoMan_7 != '' && data.bonoMan_7 != null? data.bonoMan_7 : "Bono Manual 7"),valor:(data.bonoMan_m_7 != '' ? data.bonoMan_m_7+'.00' : "0.00")},
	      	bonoManual8: {label:(data.bonoMan_8 != '' && data.bonoMan_8 != null? data.bonoMan_8 : "Bono Manual 8"),valor:(data.bonoMan_m_8 != '' ? data.bonoMan_m_8+'.00' : "0.00")},
	      	bonoManual9: {label:(data.bonoMan_9 != '' && data.bonoMan_9 != null? data.bonoMan_9 : "Bono Manual 9"),valor:(data.bonoMan_m_9 != '' ? data.bonoMan_m_9+'.00' : "0.00")},
	      	bonoManual10: {label:(data.bonoMan_10 != '' && data.bonoMan_10 != null? data.bonoMan_10 : "Bono Manual 10"),valor:(data.bonoMan_m_10 != '' ? data.bonoMan_m_10+'.00' : "0.00")},
	      	bonoManualTotal: parseInt(data.bonoMan_m_1 != '' ? data.bonoMan_m_1 : 0)+parseInt(data.bonoMan_m_2 != '' ? data.bonoMan_m_2 : 0)+parseInt(data.bonoMan_m_3 != '' ? data.bonoMan_m_3 : 0)+parseInt(data.bonoMan_m_4 != '' ? data.bonoMan_m_4 : 0)+parseInt(data.bonoMan_m_5 != '' ? data.bonoMan_m_5 : 0)+parseInt(data.bonoMan_m_6 != '' ? data.bonoMan_m_6 : 0)+parseInt(data.bonoMan_m_7 != '' ? data.bonoMan_m_7 : 0)+parseInt(data.bonoMan_m_8 != '' ? data.bonoMan_m_8 : 0)+parseInt(data.bonoMan_m_9 != '' ? data.bonoMan_m_9 : 0)+parseInt(data.bonoMan_m_10 != '' ? data.bonoMan_m_10 : 0)
	    }
	    strTable +="<br/><h3 align='center'>Movimientos Manuales</h3>";
	    strTable += "<table width='670px' page-break-inside='avoid'>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual1.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual2.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual3.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual4.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual5.label) + "</b></td>";
	    strTable += "</tr>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$', obj_bonos_manuales.bonoManual1.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual2.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual3.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual4.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual5.valor) + "</td>";
	    strTable += "</tr>";
	    strTable += "</table>";

	    strTable +="<br/>";
	    strTable += "<table width='670px' >";
	    strTable += "<tr>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual6.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual7.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual8.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual9.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>" + escapexml(obj_bonos_manuales.bonoManual10.label) + "</b></td>";
	    strTable += "<td border='0.5'><b>Total <br/>Movimientos manuales</b></td>";
	    strTable += "</tr>";
	    strTable += "<tr>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual6.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual7.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual8.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual9.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',obj_bonos_manuales.bonoManual10.valor) + "</td>";
	    strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(obj_bonos_manuales.bonoManualTotal+'.00')) +"</td>";
	    strTable += "</tr>";
	    strTable += "</table>";
	    return {strTable:strTable, bManualTotal:obj_bonos_manuales.bonoManualTotal}
	}catch(e){
		log.error('error bonos manuales',e)
	}
}
	//creacion del body 
function createTable(data,CompConfigDetails,type_emp_text,period_name,type_emp,conf_emp,promocion,idPeriod,tmp_emp,dataSO){
	try{
		var strTable = createHeader(data.emleado,type_emp_text,period_name,tmp_emp); 

		var  lineaRec = 0
		if(data.odv_entrega /*&& data.venta_propia*/ ){
			strTable += table_v_propia(data,tmp_emp,type_emp,promocion,dataSO,CompConfigDetails)
		}
			
		if (type_emp == 3 && data.comision_equipo > 0){
			strTable += table_v_equipo(data,dataSO,CompConfigDetails)
		}
		if (data.b_rec > 0){
			strTable += table_v_rec(data,dataSO,CompConfigDetails)
		}
		if((type_emp == 1 || type_emp == 3) && promocion == 2 && data.ids_garantia != ''){
			strTable +=createtablewarranty(data,dataSO)
		}
		
		var b_permanentes = table_b_Permanente(data)
		var b_manuales = table_b_Manual(data)
		strTable +=b_permanentes.strTable
		strTable +=b_manuales.strTable
		//resumen
		strTable +="<br/><h3>Resumen</h3>";
        strTable += "<table width='50%' page-break-inside= 'avoid'>";
        strTable += "<tr>";
        strTable += "<td border='0.5'><b>Concepto</b></td>";
        strTable += "<td border='0.5'><b>Importe</b></td>";
        strTable += "</tr>";
        strTable += "<tr>";
        strTable += "<td border='0.5' border-style='dotted-narrow'>Ventas Propias</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.venta_propia != ''? (data.venta_propia+'.00'):'0.00')) +"</td>";
        strTable += "</tr>";

        strTable += "<tr>";
		strTable += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(b_manuales.bManualTotal != ''? (b_manuales.bManualTotal+'.00'):'0.00')) +"</td>";
        strTable += "</tr>"

        strTable += "<tr>";
		strTable += "<td border='0.5' border-style='dotted-narrow'>Bonos Permanentes</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(b_permanentes.bPermanenteTotal != ''? (b_permanentes.bPermanenteTotal+'.00'):'0.00')) +"</td>";
        strTable += "</tr>"
        	//Solo JDG
        if (type_emp == 3){
        	strTable += "<tr>";
			strTable += "<td border='0.5' border-style='dotted-narrow'>Ventas Equipo</td>";
        	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.comision_equipo > 0 ? data.comision_equipo+'.00':'0.00')) +"</td>";
        	strTable += "</tr>"
        }
        strTable += "<tr>";
        strTable += "<td border='0.5' border-style='dotted-narrow'>Bono Productividad</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.productividad != ''? (data.productividad+'.00'):'0.00')) +"</td>";
        strTable += "</tr>";
        strTable += "<tr>";
		strTable += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.b_rec >0 ? data.b_rec+'.00':'0.00'))+"</td>";
        strTable += "</tr>"
        strTable += "<tr>";
		strTable += "<td border='0.5' border-style='dotted-narrow'>Garantia Extendida</td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.garantia >0 ? data.garantia+'.00':'0.00'))+"</td>";
        strTable += "</tr>"

        strTable += "<tr>";
        strTable += "<td border='0.5' border-style='none' align='right'><b>TOTAL DE COMISIONES</b></td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',(data.total >0 ? data.total+'.00':'0.00')) +"</b></td>";
        strTable += "</tr>";
        strTable += "<tr>";
        strTable += "<td border='0.5' border-style='none' align='right'><b>ISR*</b></td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('-$',(data.retencion != ''? data.retencion:0)+'.00') +"</b></td>";
        strTable += "</tr>";
        strTable += "<tr>";
        strTable += "<td border='0.5' border-style='none' align='right'><b>TOTAL A DEPOSITAR</b></td>";
        strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>"+ currencyFormat('$',(data.total-(data.retencion >0? data.retencion:0))+'.00') +"</b></td>";
        strTable += "</tr>";
        strTable += "</table>";
        //fin resumen
        strTable +="<br/><h7>*El cálculo del impuesto retenido se realiza de acuerdo a las tablas y tarifas vigentes publicadas por el SAT.</h7><br/>";
        strTable +="<br/><h7>Para cualquier aclaración en relación al pago de tus compensaciones " +
        			"puedes enviar un mail a incidencias@mxthermomix.com y tener a la mano este documento, " +
        			"el PDF de tu recibo fiscal así como el estado de cuenta bancario donde se refleje (o no) " +
        			"el depósito de la compensación en cuestión.</h7>";
        	
		return strTable;
	}catch(e){
		log.error('error create table',e)
	}		
			
}
function createHeader(name_employee,type_emp_text,period_name,tmp_emp){
		
	function getImage(idImg){
    	try{
    		var host 
    		var idImg 

    		if(runtime.envType  == "SANDBOX"){
    			host = "https://3367613-sb1.app.netsuite.com";
    			idImg = '2461144';
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
	var logodURL = getImage()
	var club = ""
	var nameConf = ''
	if (tmp_emp.custentity_club.length > 0) {
		//log.debug("club",tmp_emp.custentity_club[0].text)    
	  	club =  tmp_emp.custentity_club[0].text;
	} 
 	var nameConf
		for(var n in tmp_emp.custentity123 ){
			//log.debug("conf",tmp_emp.custentity123[n].value)
          	switch(tmp_emp.custentity123[n].value){
          		case '1':
	            	nameConf = 'Promocion Base'
	            	break;
          		case '5': 
		            nameConf = 'Thermomix 6'
		            break;
          		case '6': 
		            nameConf = 'Emerald Club'
		            break;
          		case '7': 
		            nameConf = 'LE Junior'
		            break;
          		case '8': 
              		nameConf = 'NLE Emerald'
              		break;
          		case '11': 
              		nameConf = 'TM6 Rectificada'
              		break;
          		case '12': 
              		nameConf = 'TM4U'
             		break;
          		case '13': 
          			nameConf = 'TM6 4 ventas 2 meses'
         			break;
          	}
      	}
    log.debug("conf",nameConf) 
	var  jdg_name_employee= name_employee;
	var fc =period_name;
			
	var strTable = "";
		strTable += "<p align='center'><img width=\"100%\" height=\"100%\" " + logodURL + "></p>";
		strTable += "<p align=\"center\" color=\"#23282*\" font-size=\"12\"><b>REPORTE DE COMPENSACIONES</b></p>";
		if(type_emp_text == 'Jefa de Grupo'){
			type_emp_text='Lider de equipo'
		}
		strTable += "<p align=\"center\"><h4><b>"+ type_emp_text.toUpperCase() +"</b></h4></p>";
		strTable += "<p align=\"center\">" + fecha_letras(fc) + "</p>";
		strTable += "<p align=\"center\">"+jdg_name_employee + "</p>";
		strTable += "<p align=\"center\">"+club + "</p>";
		strTable += "<p align=\"center\">"+nameConf+ "</p>";
 	
		return strTable;
}// fin createHeader
        //funciones auxiliares
function escapexml(xmlFileContent){
    var xmlEscapedDocument = xml.escape({
        xmlText : xmlFileContent
    });
    return xmlEscapedDocument;
}
function stringToArray(str,base){
    var multiSelectStringArray = str.split(String.fromCharCode(base));
    return multiSelectStringArray;
}
function fecha_letras(fecha){
    if(fecha != '' && fecha != null){
        fecha = fecha.split('/');
        var n_mes = fecha[0];
        var n_ano = fecha[1];
        var l_mes = new String ();
        var fecha_letras = new String();
        	switch(n_mes){
        	    case '01': l_mes = 'ENERO'; break;
        	    case '02': l_mes = 'FEBRERO'; break;
        	    case '03': l_mes = 'MARZO'; break;
        	    case '04': l_mes = 'ABRIL'; break;
        	    case '05': l_mes = 'MAYO'; break;
        	    case '06': l_mes = 'JUNIO'; break;
        	    case '07': l_mes = 'JULIO'; break;
        	    case '08': l_mes = 'AGOSTO'; break;
        	    case '09': l_mes = 'SEPTIEMBRE'; break;
        	    case '10': l_mes = 'OCTUBRE'; break;
        	    case '11': l_mes = 'NOVIEMBRE'; break;
        	    case '12': l_mes = 'DICIEMBRE'; break;
        	}
        fecha_letras = l_mes + ' ' + n_ano;
        return fecha_letras;
    }else { 
    	return ''; }
    }
function currencyFormat(signo,v){
    try{
        var amt 	= v;
			amt 	= amt.toString();
			amt 	= amt.split('.');
		var amtl 	= amt[0].length;
		var amtt 	= '';
		var n 		= 0;
		for(var a=amtl-1;a>=0; a--){
			if(n==3){
				amtt = amtt + ',' + amt[0].charAt(a); n=1;
			}else{
				amtt = amtt + amt[0].charAt(a) ; n++;
			}
		}
		var amttt = '';
		for(var a=0;a<=amtt.length;a++){
			amttt += amtt.charAt(amtt.length-a);
		}
		if(amt[1] == '' || !amt[1]){
			return v = signo + amttt + '.00';
		}else if(amt[1] != ''){
			return v = signo + amttt + '.' +amt[1];
		} else{
			return v = signo + amttt
		}
    }catch(err){
        		log.error('err currencyFormat',err);
    }
			
}
        
function search_crecord(id_jdg,type_emp,promocion){
    try{
        var type_search = ""
        var columns = config_fields[type_emp]
        //log.debug('config_fields[type_emp]',config_fields[type_emp]);
        if(type_emp == 3){
            type_search = "customrecord_compensaciones_jdg"
        }else if(type_emp == 2){
            type_search = "customrecord_compensaciones_gtm"
        }else{
            type_search = "customrecord_comisiones_presentadora"
        }
            			
        var data = {}
    	var r = record.load({
            type:  type_search,
            id: id_jdg,
            isDynamic: false
        });
    	//log.debug('type_search',type_search)
    	if(type_emp== 3){
    		data.lider = r.getText('custrecord_c_jdg_empleado')
    		data.odvNle = r.getValue('custrecord_odv_nle')// prod custrecord_odv_nle
            data.comision_equipo = r.getValue(config_fields.comision_equipo[type_emp])
            data.equipo = r.getValue(config_fields.equipo[type_emp]) 
    	}
    	if(promocion ==1){
    	    type_emp=2
    	}
		data.total=r.getValue(config_fields.total[type_emp])
        data.rec = r.getValue(config_fields.rec[type_emp])
        data.productividad = r.getValue(config_fields.productividad[type_emp])
        data.venta_propia = r.getValue(config_fields.venta_propia[type_emp])
        data.entrega_monto = r.getValue(config_fields.entrega_monto[type_emp])
        data.entregas = r.getValue(config_fields.entregas[type_emp])
        data.b_rec = r.getValue(config_fields.b_rec[type_emp])
        data.bono_m_1 = r.getValue(config_fields.bp1_monto[type_emp])
        data.bono_1 = r.getText(config_fields.bp1[type_emp])
        data.bono_2 = r.getText(config_fields.bp2[type_emp])
        data.bono_3 = r.getText(config_fields.bp3[type_emp])
        data.bono_4 = r.getText(config_fields.bp4[type_emp])
        data.bono_5 = r.getText(config_fields.bp5[type_emp])
        data.bono_6 = r.getText(config_fields.bp6[type_emp])
        data.bono_7 = r.getText(config_fields.bp7[type_emp])
        data.bono_8 = r.getText(config_fields.bp8[type_emp])
        data.bono_9 = r.getText(config_fields.bp9[type_emp])
        data.bono_10 = r.getText(config_fields.bp10[type_emp])
        data.bono_m_2 = r.getValue(config_fields.bp2_monto[type_emp])
        data.bono_m_3 = r.getValue(config_fields.bp3_monto[type_emp])
        data.bono_m_4 = r.getValue(config_fields.bp4_monto[type_emp])
        data.bono_m_5 = r.getValue(config_fields.bp5_monto[type_emp])
        data.bono_m_6 = r.getValue(config_fields.bp6_monto[type_emp])
        data.bono_m_7 = r.getValue(config_fields.bp7_monto[type_emp])
        data.bono_m_8 = r.getValue(config_fields.bp8_monto[type_emp])
        data.bono_m_9 = r.getValue(config_fields.bp9_monto[type_emp])
        data.bono_m_10 = r.getValue(config_fields.bp10_monto[type_emp])
        //manuales
        data.bonoMan_m_1 = r.getValue(config_fields.bono_m_1[type_emp])
        data.bonoMan_1 = r.getText(config_fields.bono_1[type_emp])
        data.bonoMan_2 = r.getText(config_fields.bono_2[type_emp])
        data.bonoMan_3 = r.getText(config_fields.bono_3[type_emp])
        data.bonoMan_4 = r.getText(config_fields.bono_4[type_emp])
        data.bonoMan_5 = r.getText(config_fields.bono_5[type_emp])
        data.bonoMan_6 = r.getText(config_fields.bono_6[type_emp])
        data.bonoMan_7 = r.getText(config_fields.bono_7[type_emp])
        data.bonoMan_8 = r.getText(config_fields.bono_8[type_emp])
        data.bonoMan_9 = r.getText(config_fields.bono_9[type_emp])
        data.bonoMan_10 = r.getText(config_fields.bono_10[type_emp])
        data.bonoMan_m_2 = r.getValue(config_fields.bono_m_2[type_emp])
        data.bonoMan_m_3 = r.getValue(config_fields.bono_m_3[type_emp])
        data.bonoMan_m_4 = r.getValue(config_fields.bono_m_4[type_emp])
        data.bonoMan_m_5 = r.getValue(config_fields.bono_m_5[type_emp])
        data.bonoMan_m_6 = r.getValue(config_fields.bono_m_6[type_emp])
        data.bonoMan_m_7 = r.getValue(config_fields.bono_m_7[type_emp])
        data.bonoMan_m_8 = r.getValue(config_fields.bono_m_8[type_emp])
        data.bonoMan_m_9 = r.getValue(config_fields.bono_m_9[type_emp])
        data.bonoMan_m_10 = r.getValue(config_fields.bono_m_10[type_emp])
        data.retencion = r.getValue(config_fields.retencion[type_emp])
        data.odv_entrega = r.getValue(config_fields.odv_entrega[type_emp])
        data.emleado = r.getText(config_fields.emleado[type_emp])
        data.ajuste = r.getValue(config_fields.ajuste[type_emp])  
        data.garantia = r.getValue(config_fields.garantia[type_emp])
        data.ids_garantia = r.getValue(config_fields.ids_garantia[type_emp])
        data.otranueva = config_fields.ajuste[type_emp];
        data.odv_tres_dos = r.getValue(config_fields.tres_dos[type_emp]);
        data.sc = r.getValue(config_fields.sc[type_emp]);
        data.id_presentadora = r.getValue(config_fields.emleado[type_emp])
    	data.odv_tres_nuevo= r.getValue('custrecord_reclutas_ventas');
    	//log.debug('registro',data )
    	return data;
    }catch(e){
        log.debug('Error search_crecord',e)
    }
}
    
        
        
function createtablewarranty(data,dataSO){
    try{	
    	var idGarantia = data.ids_garantia.split(',')
    	//log.debug('idGarantia',idGarantia)
    	var montoGarantia = data.garantia
    	var cc09 = {};
    	var cc09_search = search.load({
            id: 'customsearch_vw_cc09'
        });
        var pagedResults = cc09_search.runPaged();
            pagedResults.pageRanges.forEach(function (pageRange){
                var currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function (r) {
    	        var n_venta = r.getValue('custrecord_esq_ventas_pre_no_ventas')
    	        if(n_venta in cc09){
    	            cc09[n_venta].push(r.getValue('custrecord_esq_ventas_pre_compensacion'));
    	        }else{
    	            cc09[n_venta]= [r.getValue('custrecord_esq_ventas_pre_compensacion')]; 
    	        }
            });
        });    
    		 
    	var linea = 0;
    			
    	var strTab = "<br/><p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DE GARANTìA EXTENDIDA</b></p>";
	        strTab += "<table width='670px'>";
			strTab += "<tr>" ;
			strTab += "<td border='0.5' width='10px'><b>#</b></td>";
			strTab += "<td border='0.5' width='90px'><b>TIPO COMPENSACIÓN</b></td>";
			strTab += "<td border='0.5' width='100px'><b>VENTA REALIZADA POR</b></td>";
			strTab += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
			strTab += "<td border='0.5' width='0px'><b>FECHA</b></td>";
			strTab += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
			strTab += "<td border='0.5' width='40px'><b>MONTO</b></td>";
			strTab += "</tr>";
		for( i in idGarantia){
			try{
				//log.debug('idGarantia i',idGarantia[i])
				linea ++
				var objSObyid = dataSO.objSObyid
				var thisSO = objSObyid[idGarantia[i]]
				var salesRep = thisSO.salesrep[0].text
				var cliente = thisSO.entity[0].text
				var fecha = thisSO.trandate
				var pedido = thisSO.tranid
				cliente = cliente.replace(/&/gi," ")
	        	strTab +="<tr>"
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+ linea +"</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>Garantìa extendida</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+ salesRep+"</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+ cliente +"</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+ fecha +"</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+ pedido +"</td>";
				strTab += "<td border='0.5' border-style='dotted-narrow'>"+currencyFormat('$',cc09[linea-(linea-1)])+"</td>";
				strTab += "</tr>";
				
			}catch(erry){
				log.error('arrayT',erry)
			}
		}
		strTab +="<tr>"
		strTab += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Subtotal</b></td>";
		strTab += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',montoGarantia+'.00')+ "</b></td>";
		strTab += "</tr>";
    	strTab += "</table>";
    	
		
    	return strTab
    	}catch(err){
    		log.error('TableWarranty',err)
    	}
    }
       

  return {
     onRequest: onRequest
  };
});