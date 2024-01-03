/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// This sample shows how to render search results into a PDF file.
// Note that this sample is a Suitelet, so it cannot be run in the debugger.
define(['N/runtime','N/email','N/record','N/render', 'N/search','N/xml','N/config','N/file','N/url','./Vorwerk Utils.js','./Vorwerk Dictionary Script.js'],
    function(runtime,email,record,render,search,xml,config,file,url,Utils,Dictionary) {
    	var config_fields = Dictionary.getDictionayFields();

		//creacion del body 
		function createTable(v_propia,v_equipo,data,v_rec,CompConfigDetails,id_entrega,type_emp_text,period_name,type_emp,conf_emp,promocion,rec_json,idPeriod,v_tres_dos,odv_tres_dos,odv_sc,tmp_emp,confEquipo){
		//configuracion presentadora

			var bono32 = data.bono_m_8
			var bono52 = data.bono_m_9
			var bonosc = data.bono_m_10
			var strTable =createHeader(data.emleado,type_emp_text,period_name,tmp_emp); 
			log.debug('id_entrega',id_entrega)
			//datos de prueba 
			var  lineaRec = 0,
			commisionName = '',
			venta_de	  = "4550 LAURA JACQUELINE TREJO VERGARA "
			cliente		  = "343660779 ERNESTO HERMILO GUILLEN CAZARIN ",
			fecha		  = "30/9/2019",
			pedido		  = "159534",
			monto		  = "$2,500.00",
			monto_ck		  = "$350.00",
			ttlRec 		  = 1800;

			
			//Busqueda de ck
			var objCKRep = []
			 try{
			       var period = Utils.getObjPeriod(idPeriod);
			       log.debug('getCookey period',period);
			       
			       var mySearch = search.load({
			               id: 'customsearch_search_cookey'
			           });
			       mySearch.filters.push(search.createFilter({
			               name: 'trandate',
			               operator: 'within',
			               values: [period['startDate'],period['endDate']]
			           }));
			       mySearch.run().each(function(r) {
			         var salrep = r.getValue('salesrep')
			                 objCKRep.push(r.getValue('internalid'));
			              
			           });
			     }catch(err){
			       log.error("error getCooke",err);
			     }
			     log.debug('objCKRep',objCKRep)
			     
			if(v_propia != ''){
				try{
					//tabla
					/*encabezado de tabla*/
						
					strTable    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS PROPIAS</b></p>";
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
					/*fin encabezado de tabla*/
					log.debug('id_entrega',id_entrega)
					/*cuerpo de tabla*/
					for(var i in v_propia){
						if(type_emp == 1 && promocion == 1){
							monto = "$0.00"
						}else if(objCKRep.hasOwnProperty(v_propia[i].internalid)){
//							log.debug('ODV encontrada en ck')
							monto = monto_ck
						}
						lineaRec++
						var b_produc = (CompConfigDetails['1']['esquemaVentasPresentadora'][lineaRec]['bonoProductividad'])-(CompConfigDetails['1']['esquemaVentasPresentadora'][lineaRec-1]['bonoProductividad'])
						if(promocion == 1){
							b_produc = 0
						}
						//& 
						var cliente = v_propia[i].cliente.replace(/&/gi," ")
						
							strTable += "<tr>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
							
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_propia[i].employee 	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + cliente 	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_propia[i].fecha 		+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_propia[i].idExterno		+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + monto	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',(b_produc)+'.00')+ "</td>";
							/*if(type_emp == 1 && promocion == 1){
								strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + '$0.00'	+ "</td>";
							}else{
								if(id_entrega.indexOf(v_propia[i].internalid) >= 0 ){
									strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + '$0.00'	+ "</td>";
								}else{
									strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + '$0.00'	+ "</td>";
								}
							}*/
							
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
					//fin tabla
					}catch(errT1){
						log.error('errT1',errT1);
						log.error('errT1 v_propia',v_propia);
					}
			}
			
			//odv_sc = JSON.parse(odv_sc)
			log.debug('odv_sc',odv_sc)
			if (type_emp == 3){
				//Ventas Equipo
				strTable    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS DEL EQUIPO</b></p>";
				strTable += "<table width='670px'>";
				strTable += "<tr>";
				strTable += "<td border='0.5' width='10px'><b>#</b></td>";
				
				strTable += "<td border='0.5' width='0px'><b>VENTA REALIZADA POR</b></td>";
				strTable += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
				strTable += "<td border='0.5' width='0px'><b>FECHA</b></td>";
				strTable += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
				
				strTable += "</tr>";
				lineaRec=0
				
				for(var i in v_equipo){
					try{
						lineaRec++
						var cliente = v_equipo[i].cliente.replace(/&/gi," ")
						strTable += "<tr>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
						
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_equipo[i].employee 	+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" +  cliente	+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_equipo[i].fecha 		+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_equipo[i].idExterno		+ "</td>";
						
						strTable += "</tr>";
					}catch(errT2){
						log.error('errT2',errT2);
					}
					
				}
				var porcentaje
				for ( i in CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'] ){
					var desde = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['desde']
					var hasta = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['hasta']
					if (Object.keys(v_propia).length >= desde && Object.keys(v_propia).length <= hasta){
						porcentaje = CompConfigDetails[1]['esquemaVentasJefaGrupo']['propias'][i]['porcentaje']
						break;
					}
				}
				var com_aux = data.comision_equipo==0?0:currencyFormat('$',data.comision_equipo/(parseInt(porcentaje)/100)+'.00')
				
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '4' border-style='none' align='right'><b>   </b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '4' border-style='none' align='right'><b>Total comisión Venta de Equipos</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + com_aux	+ "</b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '4' border-style='none' align='right'><b> % Pagado </b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + porcentaje	+ "</b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '4' border-style='none' align='right'><b>Total comisión</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',data.comision_equipo+'.00')	+ "</b></td>";
				strTable += "</tr>";
				strTable += "</table>";
				//Fin Ventas Equipo

				log.debug('pre if v_tres_dos',v_tres_dos)
				if(v_tres_dos && v_tres_dos != '' && v_tres_dos !=' ' && Object.keys(v_tres_dos).length > 0){
					//v_tres_dos
				strTable    += "<p font-family=\"Helvetica\" font-size=\"6\" align=\"center\"><b>VENTAS RECLUTAS DEL PERIODO</b></p>";
				strTable += "<table width='670px'>";
				strTable += "<tr>";
				strTable += "<td border='0.5' width='10px'><b>#</b></td>";
				//strTable += "<td border='0.5' width='100px'><b>TIPO COMPENSACIÓN</b></td>";
				strTable += "<td border='0.5' width='0px'><b>VENTA REALIZADA POR</b></td>";
				strTable += "<td border='0.5' width='200px'><b>CLIENTE</b></td>";
				strTable += "<td border='0.5' width='0px'><b>FECHA</b></td>";
				strTable += "<td border='0.5' width='0px'><b>PEDIDO</b></td>";
				strTable += "<td border='0.5' width='0px'><b>FECHA DE ALTA</b></td>";
				strTable += "</tr>";
				lineaRec=0
				log.debug('hasta aqui')
				for(var i in v_tres_dos){
					try{
						lineaRec++
						var cliente = v_tres_dos[i].cliente.replace(/&/gi," ")
						var emp = search.lookupFields({
		                type: 'employee',
		                id: v_tres_dos[i].id_emp,
		                columns: ['hiredate']
		            	});
		    			log.debug('emp',emp.hiredate);
						strTable += "<tr>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
						//strTable += "<td border='0.5' border-style='dotted-narrow'>" + commisionName 	+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_tres_dos[i].employee 	+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" +  cliente	+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_tres_dos[i].fecha 		+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_tres_dos[i].idExterno		+ "</td>";
						strTable += "<td border='0.5' border-style='dotted-narrow'>" + emp.hiredate+ "</td>";
						strTable += "</tr>";

					}catch(errT2){
						log.error('errT2',errT2);
					}
					
				}
				var j_odv_tres_dos = JSON.parse(odv_tres_dos)
				log.debug('odv_tres_dos',Object.keys(j_odv_tres_dos))
				log.debug('odv_tres_dos',Object.keys(j_odv_tres_dos).length)
				var monto_tres_dos = Object.keys(j_odv_tres_dos).length;
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Total Ventas Reclutas del Periodo</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + lineaRec + "</b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Numero de Reclutas con almenos una venta</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + monto_tres_dos + "</b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Bono 3 + 2</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + (bono32 > 1 ? currencyFormat('$',bono32+'.00'):'0.00') + "</b></td>";
				strTable += "</tr>";
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '5' border-style='none' align='right'><b>Bono 5 + 2</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + (bono52 > 1 ? currencyFormat('$',bono52+'.00'):'0.00') + "</b></td>";
				strTable += "</tr>";
				strTable += "</table>";
				//fin v_tres_dos 
				}
				
			}
			
			 
			//Ventas Rec
			try{
				//Asignacion de configuracion de reclutameinto 
			var conf_rec = {}
	        var mySearch = search.load({
	            id: 'customsearch1905'
	         });
	        
	        var pagedResults = mySearch.runPaged();
	             pagedResults.pageRanges.forEach(function (pageRange){
	                 var currentPage = pagedResults.fetch({index: pageRange.index});
	                 currentPage.data.forEach(function (result) {
	                    var rec = result.getValue('internalid')
	                    if(result.getValue('custentity_conf_rec') != '' && result.getValue('custentity_conf_rec') != null && result.getValue('custentity_conf_rec')){
	                        conf_rec[rec]= [result.getValue('custentity_conf_rec')];
	                    }
	                    
	                 });
	                   
	           }); 
            log.debug("data.b_rec",data.b_rec)
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
				var num_odv_por_recluta = {}
				log.debug("data.rec", data.rec)
				ids_rec = JSON.parse(data.rec)
				for(var i in v_rec){
						//log.debug('v_rec[i]',v_rec[i])
						lineaRec++
						if( num_odv_por_recluta.hasOwnProperty(v_rec[i].employee)){
							num_odv_por_recluta[v_rec[i].employee]++
					
							}else{
								num_odv_por_recluta[v_rec[i].employee]=1
							}
						//Asignacion de configuracion por recluta 
						var limiteVentasReclutamiento = 6
						var configuracion_rec
			            log.debug('Pre asignacion','data.id_presentadora '+data.id_presentadora+' conf_rec '+conf_rec)
			            if(v_rec[i].id_rec in conf_rec ){
			                log.debug('conf_rec[v_rec[i].id_rec]',conf_rec[v_rec[i].id_rec])
			                configuracion_rec = conf_rec[v_rec[i].id_rec]
                          if(configuracion_rec == 11){
                            configuracion_rec = 1
                          }
                          if(configuracion_rec == 12 || configuracion_rec == 13){
                          	limiteVentasReclutamiento = 4
                          }
			            }else{
			                configuracion_rec = 1
			            }
						var cliente = v_rec[i].cliente.replace(/&/gi," ")
						//log.debug('cliente',cliente)
						//log.debug('1ids_rec[v_rec[i].internalid]',ids_rec[v_rec[i].internalid])
						var monto_rec = CompConfigDetails[configuracion_rec]['esquemaVentasReclutamiento'][(ids_rec[v_rec[i].internalid])>limiteVentasReclutamiento?0:(ids_rec[v_rec[i].internalid])]['compensacion']
						if(monto_rec>0){
							strTable += "<tr>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + lineaRec 	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_rec[i].confEquipo 	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_rec[i].employee 	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" +  cliente	+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_rec[i].fecha 		+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow'>" + v_rec[i].idExterno		+ "</td>";
							strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>" + currencyFormat('$',monto_rec >0? monto_rec : '0.00')	+ "</td>";
							strTable += "</tr>";
							
						}
						
				}
				log.debug('num_odv_por_recluta',num_odv_por_recluta)
				strTable += "<tr>";
				strTable += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Total Reclutamiento</b></td>";
				strTable += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',data.b_rec+'.00' )+ "</b></td>";
				strTable += "</tr>";
				strTable += "</table>";
			}
			}catch(errT3){
				log.error('errT3',errT3);
			}
			//Fin Ventas Rec
			
			
			
			log.debug('data',data.total)
			//movimientos manuals
			var obj_bonos = {
					bono1: {label:(data.bono_1 != '' && data.bono_1 != null? data.bono_1 : "Continuidad"),valor:(data.bono_m_1 != '' ? data.bono_m_1+'.00' : "0.00")},
					bono2: {label:(data.bono_2 != '' && data.bono_2 != null? data.bono_2 : "Cancelación Esquema"),valor:(data.bono_m_2 != '' ? data.bono_m_2+'.00' : "0.00")},
					bono3: {label:(data.bono_3 != '' && data.bono_3 != null? data.bono_3 : "Cancelación Esquema LE"),valor:(data.bono_m_3 != '' ? data.bono_m_3+'.00' : "0.00")},
					bono4: {label:(data.bono_4 != '' && data.bono_4 != null? data.bono_4 : "Bono Trimestral"),valor:(data.bono_m_4 != '' ? data.bono_m_4+'.00' : "0.00")},
					bono5: {label:(data.bono_5 != '' && data.bono_5 != null? data.bono_5 : "Split"),valor:(data.bono_m_5 != '' ? data.bono_m_5+'.00' : "0.00")},
					bono6: {label:(data.bono_6 != '' && data.bono_6 != null? data.bono_6 : "Entrega sin Ficha "),valor:(data.bono_m_6 != '' ? data.bono_m_6+'.00' : "0.00")},
					bono7: {label:(data.bono_7 != '' && data.bono_7 != null? data.bono_7 : "Emerald"),valor:(data.bono_m_7 != '' ? data.bono_m_7+'.00' : "0.00")},
					bono8: {label:(data.bono_8 != '' && data.bono_8 != null? data.bono_8 : "TM Ganadas "),valor:(data.bono_m_8 != '' ? data.bono_m_8+'.00' : "0.00")},
					bono9: {label:(data.bono_9 != '' && data.bono_9 != null? data.bono_9 : "Ajuste"),valor:(data.bono_m_9 != '' ? data.bono_m_9+'.00' : "0.00")},
					bono10: {label:(data.bono_10 != '' && data.bono_10 != null? data.bono_10 : "Desc Rec Viaje"),valor:(data.bono_m_10 != '' ? data.bono_m_10+'.00' : "0.00")},
					bonoTotal: parseInt(data.bono_m_1 != '' ? data.bono_m_1 : 0)+parseInt(data.bono_m_2 != '' ? data.bono_m_2 : 0)+parseInt(data.bono_m_3 != '' ? data.bono_m_3 : 0)+parseInt(data.bono_m_4 != '' ? data.bono_m_4 : 0)+parseInt(data.bono_m_5 != '' ? data.bono_m_5 : 0)+parseInt(data.bono_m_6 != '' ? data.bono_m_6 : 0)+parseInt(data.bono_m_7 != '' ? data.bono_m_7 : 0)+parseInt(data.bono_m_8 != '' ? data.bono_m_8 : 0)+parseInt(data.bono_m_9 != '' ? data.bono_m_9 : 0)+parseInt(data.bono_m_10 != '' ? data.bono_m_10 : 0)
			}
			log.debug('Datos EMP',type_emp+'   '+promocion)
			if((type_emp == 1 || type_emp == 3) && promocion == 2 && data.ids_garantia != ''){
				var ventas=SearchSales(data)
				strTable +=createtablewarranty(data,ventas,type_emp)
			}
			
			
			log.debug('data.total',data.total)
			strTable +="<br/><h3 align='center'>Movimientos Manuales</h3>";
			strTable += "<table width='670px'>";
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
			strTable += "<table width='670px'>";
			strTable += "<tr>";
			strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono6.label) + "</b></td>";
			strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono7.label) + "</b></td>";
			strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono8.label) + "</b></td>";
			strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono9.label) + "</b></td>";
			strTable += "<td border='0.5'><b>" + escapexml(obj_bonos.bono10.label) + "</b></td>";
			strTable += "<td border='0.5'><b>Total <br/>Movimientos manuales</b></td>";
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
			//fin movimientos manuals
			
			
			
			//resumen
			strTable +="<br/><h3>Resumen</h3>";
        	strTable += "<table width='50%'>";
        	strTable += "<tr>";
        	strTable += "<td border='0.5'><b>Concepto</b></td>";
        	strTable += "<td border='0.5'><b>Importe</b></td>";
        	strTable += "</tr>";
        	strTable += "<tr>";
        	strTable += "<td border='0.5' border-style='dotted-narrow'>Ventas Propias</td>";
        	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.venta_propia != ''? (data.venta_propia+'.00'):'0.00')) +"</td>";
        	strTable += "</tr>";
        	
//        	strTable += "<tr>";
//			strTable += "<td border='0.5' border-style='dotted-narrow'>Comisión Entrega</td>";
//        	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.entrega_monto != ''? (data.entrega_monto+'.00'):'0.00')) +"</td>";
//        	strTable += "</tr>";
        	strTable += "<tr>";
			strTable += "<td border='0.5' border-style='dotted-narrow'>Movimientos Manuales</td>";
        	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(obj_bonos.bonoTotal != ''? (obj_bonos.bonoTotal+'.00'):'0.00')) +"</td>";
        	strTable += "</tr>"
        	//Solo JDG
        	if (type_emp == 3){
        	strTable += "<tr>";
			strTable += "<td border='0.5' border-style='dotted-narrow'>Ventas Equipo</td>";
        	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.comision_equipo > 0 ? data.comision_equipo+'.00':'0.00')) +"</td>";
        	strTable += "</tr>"
        	//strTable += "<tr>";
			//strTable += "<td border='0.5' border-style='dotted-narrow'>Bono 3 + 2</td>";
        	//strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(monto_tres_dos > 1 ? '5,000.00':'0.00')) +"</td>";
        	//strTable += "</tr>"
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
//        	if(conf_emp == 2){
//        		strTable += "<tr>";
//    			strTable += "<td border='0.5' border-style='dotted-narrow'>Reclutamiento</td>";
//            	strTable += "<td border='0.5' border-style='dotted-narrow' align='right'>"+ currencyFormat('$',(data.b_rec >0 ? data.b_rec+'.00':'0.00'))+"</td>";
//            	strTable += "</tr>"
//        	}
        		
        	
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
		}
		//creacion de encabeazado
		function createHeader(name_employee,type_emp_text,period_name,tmp_emp){
			/*var configRecObj = config.load({
    		    type: config.Type.COMPANY_INFORMATION
    		});
			var companyInfoLogoId = 	configRecObj.getValue('formlogo');
			var host = url.resolveDomain({
	            hostType: url.HostType.APPLICATION
	        });
			log.debug('host',host);
			var fileObj = file.load({
			    id: companyInfoLogoId
			});
			
			
			var companyInfoLogoURL = fileObj.url;
			companyInfoLogoURL	= stringToArray(companyInfoLogoURL,38);
			companyInfoLogoURL 	= companyInfoLogoURL.join('&amp;');
			companyInfoLogoURL 	= "src='https://" + host + companyInfoLogoURL + "'/";
			
			log.debug('companyInfoLogoURL',companyInfoLogoURL);
			
			log.debug('fileObj',fileObj);*/
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
   			 	 log.debug("club",tmp_emp.custentity_club[0].text)    
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
			if(type_emp_text == 'Jefa de Grupo'){type_emp_text='Lider de equipo'}
			strTable += "<p align=\"center\"><h4><b>"+ type_emp_text.toUpperCase() +"</b></h4></p>";
			strTable += "<p align=\"center\">" + fecha_letras(fc) + "</p>";
			strTable += "<p align=\"center\">"+jdg_name_employee + "</p>";
			strTable += "<p align=\"center\">"+club + "</p>";
			strTable += "<p align=\"center\">"+nameConf+ "</p>";


			
			return strTable;
		}
		//creacion del pdf
        function onRequest(context)
        {
        	try{
        		var request = context.request;
                var response = context.response;
                var params = context.request.parameters;

                var massive = params.massive
                log.debug('massive',massive)
                log.debug('params',params)
                var tmp_emp = search.lookupFields({
			                        type: 'employee',
			                        id: params.employee,
			                        columns: ['employeetype','custentity123','custentity_promocion', 'custentity_club']//custentity123 en compensaciones de ingreso
			                    });
                log.debug('tmp_emp',tmp_emp);
                var period_name = search.lookupFields({
			                        type: 'customrecord_periods',
			                        id: params.periodo,
			                        columns: 'name'
			                    });
                log.debug('period_name',period_name.name);
                //var type_emp = tmp_emp.employeetype[0].value;
                var type_emp = params.level;
                log.debug('type_emp',type_emp)
                //var type_emp_text = tmp_emp.employeetype[0].text;
                log.debug('type_emp_text',type_emp_text)
                var tipoTexto = '';
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
                log.debug('type_emp_text',type_emp_text)
                var conf_emp = tmp_emp.custentity123[0].value;
                //var promocion = tmp_emp.custentity_promocion[0].value;
                log.debug('promocion',promocion)
                var c_record = search_crecord(params.comp,type_emp,promocion)
                if(type_emp== 3){
                	var v_equipo = venta_equipo(c_record,type_emp)
                	log.debug('c_record.odv_tres_dos',c_record.odv_tres_dos)//trabajar
                	var v_tres_dos = venta_tres_dos(c_record.odv_tres_dos,type_emp)
        		}else{
        			var v_equipo={}
        			var v_tres_dos={}
        		}
                var v_rec = venta_rec(c_record)
                var id_entrega = entrega(c_record)
                var v_propia= venta_propia(parseInt(params.periodo),parseInt(params.employee),c_record)

                   
                
                log.debug('id_entrega',id_entrega)
               
               
                // ConfigDetails
           var CompConfigDetails = Utils.getObjCompConfigDetails()
           log.debug('CompConfigDetails',CompConfigDetails)
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
        				xml += createTable(v_propia,v_equipo,c_record,v_rec,CompConfigDetails,id_entrega,type_emp_text,period_name.name,type_emp,conf_emp,promocion,c_record.rec,params.periodo,v_tres_dos,c_record.odv_tres_dos,c_record.sc,tmp_emp);
        			xml += "</body>\n";
        		xml += "</pdf>";
        		
        		email.send({
            		author: '317077',
        			recipients: ['deyvid8uriel@gmail.com'],
        			subject: 'pdf',
        			body: xml
        		}); 
        		try {
        			var fileR = render.xmlToPdf({
						xmlString: xml
	 				});

        		}
        		catch(e){
        			log.debug("error", e)
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
            
        }
        
        
        //funciones auxiliares
        function escapexml(xmlFileContent){
        	var xmlEscapedDocument = xml.escape({
        	    xmlText : xmlFileContent
        	});
        	return xmlEscapedDocument;
        }
        function stringToArray(str,base)
        {
             var multiSelectStringArray = str.split(String.fromCharCode(base));
             return multiSelectStringArray;
        }
        function fecha_letras(fecha)
        {
        	if(fecha != '' && fecha != null)
        	{
        	    fecha = fecha.split('/');
        	    var n_mes = fecha[0];
        	    var n_ano = fecha[1];
        	    var l_mes = new String ();
        	    var fecha_letras = new String();
        	    switch(n_mes)
        	    {
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
        	}
        	else { return ''; }
        }
        function currencyFormat(signo,v){
        	try{
        		var amt 	= v;
					amt 	= amt.toString();
					amt 	= amt.split('.');
				var amtl 	= amt[0].length;
				var amtt 	= '';
			    var n 		= 0;
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
					return v = signo + amttt + '.00';
				}
				else
				{
					return v = signo + amttt + '.' +amt[1];
				}
        	}catch(err){
        		log.error('err currencyFormat',err);
        	}
			
		}
        function venta_propia(period,idEmp,c_record){
        	try{
        		log.debug('c_record',c_record);
        		if(c_record.ajuste == false){
        			log.debug('period',period);
            		log.debug('idEmp',idEmp);
            		var sr = [];
                	var vpr = {};
                	var sp = search.create({
             	       type: 'customrecord_vorwerk_detail_comission',
             	       columns: [
             	           { name: 'custrecord_vorwertk_transaction'}
             	       ],
             	       filters: [
             	           {
             	               name: 'custrecord_vorwerk_period',
             	               operator: 'anyof',
             	               values: period
             	           },
             	           {
             	               name: 'custrecord_vorwerk_employee_id',
             	               operator: 'anyof',
             	               values: idEmp
             	           }
             	       ]
             	   });
             	   	
             	  	sp.run().each(function(r){
         				sr.push(r.getValue('custrecord_vorwertk_transaction'));
             	        return true;
             	   	});
             	  	log.debug('sr',sr);
             	  	if(sr != ''){
             	  		var vp = search.create({
                 	       type: search.Type.SALES_ORDER,
                 	       columns: [
                 	           { name: 'internalid'},
                 	           { name: 'salesrep'},
                 	           { name: 'entity'},
                 	           { name: 'trandate'},
                 	           { name: 'tranid'},
                 	       ],
                 	       filters: [
                 	           {
                 	               name: 'internalid',
                 	               operator: 'anyof',
                 	               values: sr
                 	           },
                 	           {
                 	           	 	name: 'mainline',
                 	                operator: 'is',
                 	                values: true
                 	           }
                 	       ]
                 	   });
                  	 	
                  		vp.run().each(function(r){
                  		 	var result  = {};
             	  		  	result.internalid = r.getValue('internalid'),
             	  		   	result.employee = r.getText('salesrep'),
             	  		   	result.cliente = r.getText('entity'),
             	  		   	result.fecha = r.getValue('trandate'),
             	  		   	result.idExterno = r.getValue('tranid'),
             	  		 	vpr[result.internalid] =  result;
                 	       return true;
             	    	});
                  	   log.debug('vpr',vpr)
             	  	}else{
             	  		log.debug('Sin ODV propias ')
             	  		var vpr = {}
             	  	}
        		}else{
        			vpr = {}
        		}
        		
         	   	
           		return vpr; 
        	}catch(err){
        		log.error("error search record",err);
        	}
        }
        function search_crecord(id_jdg,type_emp,promocion){
        	try{
        		var type_search = ""
            		var columns = config_fields[type_emp]
        		log.debug('config_fields[type_emp]',config_fields[type_emp]);
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
    	        	log.debug('type_search',type_search)
    	        	if(type_emp== 3){
                		data.comision_equipo = r.getValue(config_fields.comision_equipo[type_emp])
                		data.equipo = r.getValue(config_fields.equipo[type_emp])
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
            		data.bono_m_1 = r.getValue(config_fields.bono_m_1[type_emp])
        			data.bono_1 = r.getText(config_fields.bono_1[type_emp])
            		data.bono_2 = r.getText(config_fields.bono_2[type_emp])
            		data.bono_3 = r.getText(config_fields.bono_3[type_emp])
            		data.bono_4 = r.getText(config_fields.bono_4[type_emp])
            		data.bono_5 = r.getText(config_fields.bono_5[type_emp])
            		data.bono_6 = r.getText(config_fields.bono_6[type_emp])
            		data.bono_7 = r.getText(config_fields.bono_7[type_emp])
            		data.bono_8 = r.getText(config_fields.bono_8[type_emp])
            		data.bono_9 = r.getText(config_fields.bono_9[type_emp])
            		data.bono_10 = r.getText(config_fields.bono_10[type_emp])
            		data.bono_m_2 = r.getValue(config_fields.bono_m_2[type_emp])
            		data.bono_m_3 = r.getValue(config_fields.bono_m_3[type_emp])
            		data.bono_m_4 = r.getValue(config_fields.bono_m_4[type_emp])
            		data.bono_m_5 = r.getValue(config_fields.bono_m_5[type_emp])
            		data.bono_m_6 = r.getValue(config_fields.bono_m_6[type_emp])
            		data.bono_m_7 = r.getValue(config_fields.bono_m_7[type_emp])
            		data.bono_m_8 = r.getValue(config_fields.bono_m_8[type_emp])
            		data.bono_m_9 = r.getValue(config_fields.bono_m_9[type_emp])
            		data.bono_m_10 = r.getValue(config_fields.bono_m_10[type_emp])
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
    	        	log.debug('registro',data )
    	        	return data;
        	}catch(e){
        		log.debug('Error search_crecord',e)
        	}
        }
        function venta_rec(data){
        	try{
        		// ODV de las reclutas 
		      	   log.debug('data.rec **********',data);
		      	 if(data.rec == ""){
		      		   return '';
		      	   }
		      	   ids_rec = JSON.parse(data.rec)
		      	   
		           var odv_rec_result = {};
		      	   if('rec' in data && data.rec != '' && data.rec != null){
		      		   	var ids = Object.keys(ids_rec)
			         	var odv_rec = search.create({
			      	       type: search.Type.SALES_ORDER,
			      	       columns: [
			      	           { name: 'internalid'},
			      	           { name: 'salesrep'},
			      	           { name: 'entity'},
			      	           { name: 'trandate'},
			      	           { name: 'tranid'},
			      	           {name : 'custentity123',join : 'salesrep'}
			      	       ],
			      	       filters: [
			      	           {
			      	               name: 'internalid',
			      	               operator: 'anyof',
			      	               values: ids
			      	           },
			      	           {
			      	           	 	name: 'mainline',
			      	                operator: 'is',
			      	                values: true
			      	           }
			      	       ]
			      	   });
			       	 	var pagedResults = odv_rec.runPaged();
			                 pagedResults.pageRanges.forEach(function (pageRange){
			                     var currentPage = pagedResults.fetch({index: pageRange.index});
			                     currentPage.data.forEach(function (r) {
					       		 	var result  = {};
					  	  		  	result.internalid = r.getValue('internalid'),
					  	  		   	result.employee = r.getText('salesrep'),
					  	  		   	result.id_rec = r.getValue('salesrep'),
					  	  		   	result.cliente = r.getText('entity'),
					  	  		   	result.fecha = r.getValue('trandate'),
					  	  		   	result.idExterno = r.getValue('tranid'),
					  	  		   	

					  	  		   	result.confEquipo = r.getValue({name : 'custentity123',join : 'salesrep'});

					  	  		   	var confv_rec = result.confEquipo.split(',')
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

					              result.confEquipo = nameConfEquipo
									      //log.debug('Nombre de configuracion equipo',nameConfEquipo)

					  	  		   	odv_rec_result[result.internalid] =  result;
					  	  		  	return true;
			                   });
		                 });
			                 log.debug('odv_rec_result',odv_rec_result) 
		      	   }else{
		      		 odv_rec_result ='' 
		      	   }
		      	   return odv_rec_result;
        	}catch(e){
        		log.debug('Error venta_rec',e)
        	}
        	
        }
        function entrega(data){
        	try{
        		if('odv_entrega' in data && data.odv_entrega != '' && data.odv_entrega != null){
            		if(data.odv_entrega != "" && data.odv_entrega != null){
            			//entrega
    	        		log.debug("ref",data.odv_entrega);
    		        	id_entrega = data.odv_entrega.split(",");
    		        	log.debug('id_entrega',id_entrega)
            		}
            		
            	}else{
            		id_entrega = []
            	}
            	return id_entrega;
        	}catch(e){
        		log.debug('Error entrega',e)
        	}
        	
        }
        
        function venta_equipo(data,type_emp,confEquipo){
        	try{
        		if(type_emp == 3){
        			log.debug("ref",2);
        			// ODV del equipo 
    	        	var odv_equipo_result = {}
    	        	
    	        	if(data.equipo != ""){
    	        		log.debug('data.equipo',data.equipo)
    	        		var ids = data.equipo.split(",");
    	        		log.debug('ids',ids)
    	        		var odv_equipo = search.create({
    	 	     	       type: search.Type.SALES_ORDER,
    	 	     	       columns: [
    	 	     	           { name: 'internalid'},
    	 	     	           { name: 'salesrep'},
    	 	     	           { name: 'entity'},
    	 	     	           { name: 'trandate'},
    	 	     	           { name: 'tranid'},
    	 	     	           { name: 'custentity123', join: 'salesrep'},
    	 	     	       ],
    	 	     	       filters: [
    	 	     	           {
    	 	     	               name: 'internalid',
    	 	     	               operator: 'anyof',
    	 	     	               values: ids
    	 	     	           },
    	 	     	           {
    	 	     	           	 	name: 'mainline',
    	 	     	                operator: 'is',
    	 	     	                values: true
    	 	     	           }
    	 	     	       ]
    	 	     	   });
    	        		var confEquipo 
    	 	      	 	var pagedResults = odv_equipo.runPaged();
    	 	                pagedResults.pageRanges.forEach(function (pageRange){
    	 	                    var currentPage = pagedResults.fetch({index: pageRange.index});
    	 	                    currentPage.data.forEach(function (r) {
    	 		      		 	var result  = {}

    	 		      		 	result.busqueda = r.getAllValues(),
    	 		 	  		  	result.internalid = r.getValue('internalid'),
    	 		 	  		   	result.employee = r.getText('salesrep'),
    	 		 	  		   	result.cliente = r.getText('entity'),
    	 		 	  		   	result.fecha = r.getValue('trandate'),
    	 		 	  		   	result.idExterno = r.getValue('tranid'),
    	 		 	  		   	result.confEquipo = r.getValue({name : 'custentity123',join : 'salesrep'});
 
    	 		 	  		  	odv_equipo_result[result.internalid] =  result;
    	 		     	      return true;
    	 		 	    	});
    	 	              
    	                 });
    	        		
    	        	}
    	        	
    	      	   log.debug('odv_equipo_result',odv_equipo_result)

        		}else{
        			var odv_equipo_result = {}
        		}  	   
        	
        		return odv_equipo_result;

        	}catch(err){
        		log.error("error venta_equipo",err)
        	}
        	
        }
        function venta_tres_dos(data,type_emp){
        	try{
        		if(type_emp == 3){
        			log.debug("ref",2);
        			// ODV del equipo 
    	        	var odv_equipo_result = {}
    	        	
    	        	if(data != ""){
    	        		log.debug('data venta_tres_dos',JSON.parse(data))
    	        		data = JSON.parse(data)
    	        		var ids = []
						for(i in data){
    	        			for(e in data[i]){
    	        				ids.push(data[i][e])
    	        			}
    	        		}
    	        		log.debug('ids',ids)
    	        		var odv_equipo = search.create({
    	 	     	       type: search.Type.SALES_ORDER,
    	 	     	       columns: [
    	 	     	           { name: 'internalid'},
    	 	     	           { name: 'salesrep'},
    	 	     	           { name: 'entity'},
    	 	     	           { name: 'trandate'},
    	 	     	           { name: 'tranid'},

    	 	     	       ],
    	 	     	       filters: [
    	 	     	           {
    	 	     	               name: 'internalid',
    	 	     	               operator: 'anyof',
    	 	     	               values: ids
    	 	     	           },
    	 	     	           {
    	 	     	           	 	name: 'mainline',
    	 	     	                operator: 'is',
    	 	     	                values: true
    	 	     	           }
    	 	     	       ]
    	 	     	   });
    	 	      	 	var pagedResults = odv_equipo.runPaged();
    	 	                pagedResults.pageRanges.forEach(function (pageRange){
    	 	                    var currentPage = pagedResults.fetch({index: pageRange.index});
    	 	                    currentPage.data.forEach(function (r) {
    	 		      		 	var result  = {};
    	 		 	  		  	result.internalid = r.getValue('internalid'),
    	 		 	  		   	result.employee = r.getText('salesrep'),
    	 		 	  		   	result.cliente = r.getText('entity'),
    	 		 	  		   	result.fecha = r.getValue('trandate'),
    	 		 	  		   	result.idExterno = r.getValue('tranid'),
    	 		 	  		   	result.id_emp = r.getValue('salesrep'),
    	 		 	  		   	odv_equipo_result[result.internalid] =  result;
    	 		 	  		   	log.debug('fin ciclo')
    	 		     	       return true;
    	 		 	    	});
    	 	              
    	                 });
    	        		
    	        	}else{
    	        		log.debug('NO data')
    	        		var odv_equipo_result = {}
    	        	}
    	        	
    	        	
    	      	   log.debug('odv_equipo_result venta_tres_dos',odv_equipo_result)
        		}else{
        			var odv_equipo_result = {}
        		}
	        	
	        	
	      	   try{
	      		
	      	   }catch(e){
	      		   log.debug('error odv tres mas dos',e)
	      	   }
	      	   
        	
        		return odv_equipo_result;
        	}catch(err){
        		log.error("error tres mas dos",err)
        	}
        	
        }
        //fin de funciones auxilliares
        return {
            onRequest: onRequest
        };
        
        function createtablewarranty(data,ventas,type_emp){
        	try{
        		log.debug('ventas',ventas)
        		 var numVentas = ventas.length
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
					for(var i= 0; i<ventas.length; i++){
				try{
					linea ++
					var cliente = ventas[i].cliente.replace(/&/gi," ")
		        	strTab +="<tr>"
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+ linea +"</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>Garantìa extendida</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+ ventas[i].vendedor+"</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+ cliente +"</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+ ventas[i].fecha +"</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+ ventas[i].internal +"</td>";
					strTab += "<td border='0.5' border-style='dotted-narrow'>"+currencyFormat('$',cc09[linea-(linea-1)])+"</td>";
					strTab += "</tr>";
					
				}catch(erry){
					log.error('arrayT',erry)
				}
			}
					strTab +="<tr>"
					strTab += "<td border='0.5' colspan= '6' border-style='none' align='right'><b>Subtotal</b></td>";
					strTab += "<td border='0.5' border-style='dotted-narrow' align='right'><b>" + currencyFormat('$',cc09[linea])	+ "</b></td>";
					strTab += "</tr>";
        	strTab += "</table>";
        	log.debug('ventas',ventas)
			log.debug('strTab',strTab)
        	return strTab
        	}catch(err){
        		log.error('TableWarranty',err)
        	}
        }
        function SearchSales(data){
        	try{
        		var ventas = [];
        	var busqueda = search.create({
                type: 'salesorder',
                columns: ['entity','trandate','tranid','salesrep'],
                filters: [['internalid','anyof',data.ids_garantia.split(",")],'and',['mainline','is',true]]
            });
        	busqueda.run().each(function(r){
	               ventas.push({
	            	 vendedor:r.getText('salesrep'),
	            	 cliente: r.getText('entity'),
	            	 fecha: r.getValue('trandate'),
	            	 internal: r.getValue('tranid'),
	            	 
	               })
	                 return true;
	               
	           });
        	
        	return ventas
        	}catch(error){
        		log.error('SearchSales',error)
        	}
        }
    });