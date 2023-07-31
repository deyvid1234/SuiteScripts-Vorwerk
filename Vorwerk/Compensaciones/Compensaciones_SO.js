function Compensaciones_SO_BeforeLoad(type, form, request) {
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try {
		if(type == 'create' || type == 'copy') {
			nlapiSetFieldValue('custbody_comision_aplicada_jdg', '',true,true);
			nlapiSetFieldValue('custbody_comision_aplicada_pre','',true,true);
			nlapiSetFieldValue('custbody_comision_aplicada_gtm','',true,true); 
			nlapiSetFieldValue('custbody_comision_aplicada_rec','',true,true); 
			nlapiSetFieldValue('custbody_comision_aplicada_jdg_super','',true,true); 
			nlapiSetFieldValue('custbody_comision_aplicada_jdg_split', '',true,true); 
			nlapiSetFieldValue('custbody80', '',true,true);
			nlapiSetFieldValue('custbody79', '',true,true); 
		}
	} catch(e) {
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();		
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= 20003;
	  	var recipient			= 'carlos.alvarez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
  			body 			   += '<table>';
  				body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
  				body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
  				body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
  			body 			   += '</table>';
	  		body 			   += '<br>';
	  		body 			   += '<br>';
	  	
	  		if( e instanceof nlobjError ) {
	  		var ecode 		 = returnBlank(e.getCode());
			var edetails 	 = returnBlank(e.getDetails());
			var eid 		 = returnBlank(e.getId());
			var einternalid	 = returnBlank(e.getInternalId());
			var estacktrace	 = returnBlank(e.getStackTrace());
			
			if(estacktrace != '') {
				estacktrace	 = estacktrace.join();
			}
			var euserevent 	 = returnBlank(e.getUserEvent());
			nlapiLogExecution( 'ERROR', 'ecode',ecode);
			nlapiLogExecution( 'ERROR', 'edetails',edetails);
			nlapiLogExecution( 'ERROR', 'eid',eid);
			nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
			nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
			nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		} else {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}

function Compensaciones_SO_BeforeSubmit(type) {
	
	
	
  	var otroFinanciamiento = nlapiGetFieldValue('custbody_otro_financiamiento');
  	var comentarios = nlapiGetFieldValue('custbody_comentarios');
  	var formaPago = nlapiGetFieldValue('custbody_cfdi_formadepago');
  	var metodoPago = nlapiGetFieldValue('custbody_cfdi_metpago_sat');
  	var cfdi = nlapiGetFieldValue('custbody_uso_cfdi');
  
  	if(!otroFinanciamiento && !comentarios && !formaPago && !metodoPago && !cfdi){
  		
  		//-- Valida que el calendario vw no este cerrado:
//  		var factFec = nlapiStringToDate(nlapiGetFieldValue('trandate'));
//  		var factFecM = factFec.getMonth() ;
//  		var factFecM1 = factFec.getMonth() + 1;
//  		var factFecY = factFec.getFullYear();
//  		var filtersFC = [new nlobjSearchFilter('custrecord_year', null, 'equalto', factFecY)];
//  		var resultsFechasCorte 	= nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null);
//  		
  		
  		var trandate = nlapiGetFieldValue('trandate');
  		var columnsPeriod = [new nlobjSearchColumn('name'), new nlobjSearchColumn('custrecord_cerrado')];
  		var filtersPeriod = [['custrecord_inicio','onorbefore', trandate], 'and', ['custrecord_final','onorafter', trandate], 'and', ['isinactive','is',false]];
  		var srchPeriods = nlapiSearchRecord('customrecord_periods', null, filtersPeriod, columnsPeriod);

  		
  		
        if(srchPeriods) {	        	
        	var periodName = srchPeriods[0].getValue('name');
      		var isClosed = srchPeriods[0].getValue('custrecord_cerrado') == 'T';
          if(isClosed){
	          throw 'La transacción se encuentra en un periodo cerrado. Este registro no puede ser modificado/creado. Consulte con el administrador.';
	      }
      		
          /*var inicioPeriodo = Number(resultsFechasCorte[0].getValue('custrecord_mes_' + (1 + factFecM)));
          var inicioPeriodo1 = Number(resultsFechasCorte[0].getValue('custrecord_mes_' + (1 + factFecM1)));

          var fechaInicioPeriodo = new Date(factFecY, factFecM, inicioPeriodo);
          var fechaCorteeriodo = new Date(factFecY, factFecM1, inicioPeriodo1);

          var perodoCerrado = 'F';

          if(factFec >= fechaInicioPeriodo && factFec <= fechaCorteeriodo){
              perodoCerrado = resultsFechasCorte[0].getValue('custrecord_periodo_' + (1 + factFecM1) + '_cerrado');
          } else {
              perodoCerrado = resultsFechasCorte[0].getValue('custrecord_periodo_' + (1 + factFecM) + '_cerrado');
          }*/

//          if(perodoCerrado == 'T'){
//              throw 'La transacción se encuentra en un periodo cerrado. Este registro no puede ser modificado/creado. Consulte con el administrador.';
//          }
        } else {
            throw 'No existe un calendario VORWERKcreado. Consulte con el administrador.';
        }
    }
	
	
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try {
		if(type == 'delete') {
			var tranRec 		= nlapiLoadRecord('salesorder',recordId);
	        var com_jdg         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg'));
	        var com_pre         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_pre'));
	        var com_gtm         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_gtm'));
	        var com_rec         = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_rec'));
	        var com_jdg_split   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_split'));
	        var com_jdg_super   = returnBlank(tranRec.getFieldValue('custbody_comision_aplicada_jdg_super'));
			var pedido_num      = returnBlank(nlapiGetFieldValue('tranid'));
			var tab 			= '&nbsp;&nbsp;&nbsp;&nbsp;';
			var hoy 			= new Date();
			var context 		= nlapiGetContext();
			var asunto 			= 'El pedido: ' + pedido_num  + ' con compensaciones ha sido borrado';
			var msg    			= 'El usuario <b>'+ context.getName() + '</b> borro el pedido <b>' + pedido_num  + '</b> con fecha de borrado <b>' + nlapiDateToString(hoy) +'</b>.';
				msg 		   += '<br><br>AquÃ­ las compensaciones afectadas:<br>';
			if(com_jdg != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_jdg", com_jdg, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Jefa de Grupo</b></a><br>';
			}
			
			if(com_pre != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_pre", com_pre, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Presentadora</b></a><br>';
			}
			
			if(com_gtm != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_gtm", com_gtm, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Trabaja X TM</b></a><br>';
			}
			
			if(com_rec != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_rec", com_gtm, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Reclutamiento</b></a><br>';
			}
			
			if(com_jdg_split != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_jdg", com_jdg_split, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Jefa de Grupo Split</b></a><br>';
			}
			
			if(com_jdg_super != '') {
				var url			= nlapiResolveURL("RECORD", "customrecord_comisiones_jdg", com_jdg_super, 'VIEW');
				msg += tab + '>. <a href=' + url + '><b>Jefa de Grupo Supervisor</b></a><br>';
			}
			
	    	if(com_jdg != '' || com_pre != '' || com_gtm != '' || com_rec != '' || com_jdg_split != '' || com_jdg_super != '') {
	    	    var author         			= nlapiGetUser();
	    	    var recipient      			= 'Mariadelosangeles.islas@vorwerk.de';'carlos.alvarez@imr.com.mx'; 
		        var subject        			= asunto;
	    	    var body           			= msg;
	    	    var cc             			= 'luis.liceaga@vorwerk.de';
	    	    var bcc           			= null;
				var records		 			= null;
	    	    var attachments   			= null;
	    	    nlapiSendEmail(author, recipient, subject, body, cc, bcc, records,attachments);
	    	}
	    }
	} catch(e) {
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();		
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= 20003;
	  	var recipient			= 'carlos.alvarez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
		body 			   += '<table>';
		body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
		body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
		body 			   += '</table>';
  		body 			   += '<br>';
  		body 			   += '<br>';
	  	
  		if( e instanceof nlobjError ) {
	  		var ecode 		 = returnBlank(e.getCode());
			var edetails 	 = returnBlank(e.getDetails());
			var eid 		 = returnBlank(e.getId());
			var einternalid	 = returnBlank(e.getInternalId());
			var estacktrace	 = returnBlank(e.getStackTrace());
			
			if(estacktrace != '') {
				estacktrace	 = estacktrace.join();
			}
			var euserevent 	 = returnBlank(e.getUserEvent());
			nlapiLogExecution( 'ERROR', 'ecode',ecode);
			nlapiLogExecution( 'ERROR', 'edetails',edetails);
			nlapiLogExecution( 'ERROR', 'eid',eid);
			nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
			nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
			nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		}
	    else
	    {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}
function Compensaciones_SO_AfterSubmit(type) {
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try {
		if(type!='delete') {
			var recordSO	= nlapiLoadRecord(recordType, recordId);
			
			var compensacionesIngreso = null;
			var fechaObjectivo = null;	
			
			var fechaEntrega = recordSO.getFieldValue('custbody_fcha_entrega_tm5_cliente');	
			var fechaEntregaObj = nlapiStringToDate(fechaEntrega);
			var factFec = nlapiStringToDate(recordSO.getFieldValue('trandate'));
			
			if(returnBlank(recordSO.getFieldValue('salesrep')!='')) {
				var filters  = new nlobjSearchFilter('internalid',null,'is',recordSO.getFieldValue('salesrep'));
				var columns  = new Array();
				columns[0] = new nlobjSearchColumn('supervisor');
				columns[1] = new nlobjSearchColumn('custentity_jefa_grupo_split');
				columns[2] = new nlobjSearchColumn('custentity_delegada');
				columns[3] = new nlobjSearchColumn('location');
				columns[4] = new nlobjSearchColumn('custentity_delegacion');
				columns[5] = new nlobjSearchColumn('custentity_nombre_unidad');
				columns[6] = new nlobjSearchColumn('employeetype');
				columns[7] = new nlobjSearchColumn('custentity_promocion');
				columns[8] = new nlobjSearchColumn('custentity_nombre_unidad','custentity_jefa_grupo_split');
				columns[9] = new nlobjSearchColumn('custentity_delegacion','custentity_jefa_grupo_split');
				columns[10] = new nlobjSearchColumn('custentity123');//compensaciones de ingreso
				columns[11] = new nlobjSearchColumn('custentity_fin_objetivo_2');
				columns[12] = new nlobjSearchColumn('custentity_fin_objetivo_2_reactivacion');
				
				var employee = returnBlank(nlapiSearchRecord('employee',null,filters,columns));
				
				if(employee!='') {
					recordSO.setFieldValue('custbody_jefa_grupo',employee[0].getValue('supervisor'));
					recordSO.setFieldValue('custbody_jefa_grupo_split',employee[0].getValue('custentity_jefa_grupo_split'));
					recordSO.setFieldValue('custbody_delegada',employee[0].getValue('custentity_delegada'));
					recordSO.setFieldValue('custbody_sucursal',employee[0].getValue('location'));
					recordSO.setFieldValue('custbody_delegacion',employee[0].getValue('custentity_delegacion'));
					recordSO.setFieldValue('custbody_nombre_unidad',employee[0].getValue('custentity_nombre_unidad'));
					recordSO.setFieldValue('custbody_nombre_unidad_split',employee[0].getValue('custentity_nombre_unidad','custentity_jefa_grupo_split'));
					recordSO.setFieldValue('custbody_delegacion_split',employee[0].getValue('custentity_delegacion','custentity_jefa_grupo_split'));
					recordSO.setFieldValue('custbody_jerarquia',employee[0].getValue('employeetype'));
					recordSO.setFieldValue('custbody_esquema',employee[0].getValue('custentity_promocion'));
					
					compensacionesIngreso = employee[0].getValue('custentity123');
					var fechaReactivacion = employee[0].getValue('custentity_fin_objetivo_2_reactivacion');
					
					if(fechaReactivacion){
						fechaObjectivo = nlapiStringToDate(fechaReactivacion);
					} else {
						fechaObjectivo = nlapiStringToDate(employee[0].getValue('custentity_fin_objetivo_2'));
					}
				}
				
				filters = new nlobjSearchFilter('internalid',null,'is',recordSO.getFieldValue('salesrep'));
				columns = new nlobjSearchColumn('supervisor');
				var resultsJDG = (nlapiSearchRecord("employee", null, filters, columns));
				
				if(resultsJDG!='') {
		
					var jefaGrupo = returnBlank(resultsJDG[0].getValue('supervisor'));
					if(jefaGrupo!='') {				
						filters = new nlobjSearchFilter('internalid',null,'is',resultsJDG[0].getValue('supervisor'));
						columns = new nlobjSearchColumn('email');
						var resultsJDG_Email = (nlapiSearchRecord("employee", null, filters, columns));
						if(resultsJDG_Email!='') { 
							recordSO.setFieldValue('custbody_email_jefa_grupo',resultsJDG_Email[0].getValue('email'));
						}
					}
				}
			} else {
				recordSO.setFieldValue('custbody_email_jefa_grupo','');
				recordSO.setFieldValue('custbody_jefa_grupo','');
				recordSO.setFieldValue('custbody_jefa_grupo_split','');
				recordSO.setFieldValue('custbody_delegada','');
				recordSO.setFieldValue('custbody_sucursal','');
				recordSO.setFieldValue('custbody_delegacion','');
				recordSO.setFieldValue('custbody_nombre_unidad','');
				recordSO.setFieldValue('custbody_nombre_unidad_split','');
                recordSO.setFieldValue('custbody_delegacion_split','');
				recordSO.setFieldValue('custbody_jerarquia','');
				recordSO.setFieldValue('custbody_esquema','');
			}
			
			nlapiSubmitRecord(recordSO, true, true);
	
			//-------------------------------------------------------------------
			//- Buscar el registro principal dec configuraciones
			var configuracionPrincipal = null;			
			var filters = [['custrecord_conf_principal','is','T'], 'and', ['isinactive','is',false]];
			
			var srchCONFG = nlapiSearchRecord('customrecord_conf_de_compensaciones', null, filters);
			if(srchCONFG && srchCONFG.length > 0){
				configuracionPrincipal = {
					id: srchCONFG[0].id
				}
			}
			
			//-------------------------------------------------------------------
			//-- Busca las configuraciones de reglas de comisiones que no son acumuladores
			var columns = [new nlobjSearchColumn('custrecord_cdc_articulos_permitidos'),
				new nlobjSearchColumn('custrecord_cdc_tipos_de_venta_permitido'),
				new nlobjSearchColumn('custrecord_cdc_ventas_minimas_txtm'),
				new nlobjSearchColumn('custrecord_cdc_vigencia_desde_esp'),
				new nlobjSearchColumn('custrecord_cdc_vigencia_hasta_esp'),
				new nlobjSearchColumn('custrecord_cdc_ventas_maximas_rec'),
				new nlobjSearchColumn('custrecord_cdc_ventas_maximas_esp'),
				new nlobjSearchColumn('custrecordpuntosflag'),
				new nlobjSearchColumn('custrecordconvpuntos'),
				new nlobjSearchColumn('custrecord31'),//Fecha de entrega 1
				new nlobjSearchColumn('custrecord32'),//Fecha de Entrega 2
				new nlobjSearchColumn('custrecord33'),//Fecha de Entrega 3
				new nlobjSearchColumn('custrecord34'),//Fecha de Entrega 4
				new nlobjSearchColumn('custrecord35'),//Fecha de Entrega 5
				//--Columnas de compensacion por default
			    new nlobjSearchColumn('custrecord26'),
				new nlobjSearchColumn('custrecord_cdc_articulos_permitidos','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_tipos_de_venta_permitido','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_ventas_minimas_txtm','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_vigencia_desde_esp','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_vigencia_hasta_esp','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_ventas_maximas_rec','custrecord26'),
			    new nlobjSearchColumn('custrecord_cdc_ventas_maximas_esp','custrecord26'),
			    new nlobjSearchColumn('custrecordpuntosflag','custrecord26'),
			    new nlobjSearchColumn('custrecordconvpuntos','custrecord26'),
			    new nlobjSearchColumn('custrecord31','custrecord26'),//Fecha de Entrega 1
			    new nlobjSearchColumn('custrecord32','custrecord26'),//Fecha de entrega 2
			    new nlobjSearchColumn('custrecord33','custrecord26'),//Fecha de Entrega 3
			    new nlobjSearchColumn('custrecord34','custrecord26'),//Fecha de Entrega 4
			    new nlobjSearchColumn('custrecord35','custrecord26')];//Fecha de Entrega 5
			
			var filters = [['custrecord_conf_principal','is','F'], 'and', ['isinactive','is',false]];
			
			if(compensacionesIngreso){
				filters.push('and');
				filters.push(["internalid","anyof",compensacionesIngreso.split(",")]);
			}
			
			var srchRcrd = nlapiSearchRecord('customrecord_conf_de_compensaciones', null, filters, columns);
			var isSaved = false;
			
			var fc_complete = '';
			var trandate = nlapiGetFieldValue('trandate');
	  		var columnsPeriods = [new nlobjSearchColumn('name'), new nlobjSearchColumn('custrecord_inicio'), new nlobjSearchColumn('custrecord_cerrado')];
	  		var filtersPeriods = [['custrecord_inicio','onorbefore', trandate], 'and', ['custrecord_final','onorafter', trandate], 'and', ['isinactive','is',false]];
	  		var srchPeriods = nlapiSearchRecord('customrecord_periods', null, filtersPeriods, columnsPeriods);
	  		
			for(var imain = 0; compensacionesIngreso && srchRcrd && imain < srchRcrd.length; imain++){				
				var recordConfComp = srchRcrd[imain];
				var recordConfCompId = recordConfComp.id;
				
				var _cdc_articulos_permitidos 		= returnBlank(recordConfComp.getValue('custrecord_cdc_articulos_permitidos').split(','));
				var _cdc_tipos_de_venta_permitido 	= returnBlank(recordConfComp.getValue('custrecord_cdc_tipos_de_venta_permitido').split(','));
				var _cdc_ventas_minimas_txtm 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_minimas_txtm'));
				var _cdc_vigencia_desde_esp 		= returnBlank(recordConfComp.getValue('custrecord_cdc_vigencia_desde_esp'));
				var _cdc_vigencia_hasta_esp 		= returnBlank(recordConfComp.getValue('custrecord_cdc_vigencia_hasta_esp'));
				var _cdc_ventas_maximas_rec 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_maximas_rec'));
				var _cdc_ventas_maximas_esp 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_maximas_esp'));
				var acumulaPuntos = recordConfComp.getValue('custrecordpuntosflag') == 'T';
				var conversion = recordConfComp.getValue('custrecordconvpuntos');	
				var fieldNameEntrega = 'custrecord_esq_ventas_pre_entrega';	//-- Campo para obtener el nombre de la columna segun 
																			//-- el criterio de fecha de entrega
				var fechaEntrega1 = recordConfComp.getValue('custrecord31');
				var fechaEntrega2 = recordConfComp.getValue('custrecord32');
				var fechaEntrega3 = recordConfComp.getValue('custrecord33');
				var fechaEntrega4 = recordConfComp.getValue('custrecord34');
				var fechaEntrega5 = recordConfComp.getValue('custrecord35');
					
				if(factFec.getTime() > fechaObjectivo.getTime()){
					nlapiLogExecution( 'DEBUG', "factFec ","Usando configuración default..." + recordConfComp.getValue('custrecord26'));
					_cdc_articulos_permitidos 		= returnBlank(recordConfComp.getValue('custrecord_cdc_articulos_permitidos','custrecord26').split(','));
					_cdc_tipos_de_venta_permitido 	= returnBlank(recordConfComp.getValue('custrecord_cdc_tipos_de_venta_permitido','custrecord26').split(','));
					_cdc_ventas_minimas_txtm 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_minimas_txtm','custrecord26'));
					_cdc_vigencia_desde_esp 		= returnBlank(recordConfComp.getValue('custrecord_cdc_vigencia_desde_esp','custrecord26'));
					_cdc_vigencia_hasta_esp 		= returnBlank(recordConfComp.getValue('custrecord_cdc_vigencia_hasta_esp','custrecord26'));
					_cdc_ventas_maximas_rec 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_maximas_rec','custrecord26'));
					_cdc_ventas_maximas_esp 		= returnNumber(recordConfComp.getValue('custrecord_cdc_ventas_maximas_esp','custrecord26'));
					acumulaPuntos = recordConfComp.getValue('custrecordpuntosflag','custrecord26') == 'T';
					conversion = recordConfComp.getValue('custrecordconvpuntos','custrecord26');
					recordConfCompId = recordConfComp.getValue('custrecord26');
					
					fechaEntrega1 = recordConfComp.getValue('custrecord31','custrecord26');
					fechaEntrega2 = recordConfComp.getValue('custrecord32','custrecord26');
					fechaEntrega3 = recordConfComp.getValue('custrecord33','custrecord26');
					fechaEntrega4 = recordConfComp.getValue('custrecord34','custrecord26');
					fechaEntrega5 = recordConfComp.getValue('custrecord35','custrecord26');
				}
				
				///- Obtiene el nombre de la columna para el calculo de la entrega
				fechaEntrega1 = fechaEntrega1?nlapiStringToDate(fechaEntrega1):null;
				fechaEntrega2 = fechaEntrega2?nlapiStringToDate(fechaEntrega2):null;
				fechaEntrega3 = fechaEntrega3?nlapiStringToDate(fechaEntrega3):null;
				fechaEntrega4 = fechaEntrega4?nlapiStringToDate(fechaEntrega4):null;
				fechaEntrega5 = fechaEntrega5?nlapiStringToDate(fechaEntrega5):null;
				
				if(fechaEntrega1 && fechaEntregaObj && fechaEntregaObj.getTime() <= fechaEntrega1.getTime()){
					fieldNameEntrega = 'custrecord_esq_ventas_pre_entrega';
				} else if(fechaEntrega2 &&fechaEntregaObj &&  fechaEntregaObj.getTime() <= fechaEntrega2.getTime()){
					fieldNameEntrega = 'custrecord27';
				} else if(fechaEntrega3 &&fechaEntregaObj &&  fechaEntregaObj.getTime() <= fechaEntrega3.getTime()){
					fieldNameEntrega = 'custrecord28';
				} else if(fechaEntrega4 &&fechaEntregaObj &&  fechaEntregaObj.getTime() <= fechaEntrega4.getTime()){
					fieldNameEntrega = 'custrecord29';
				} else if(fechaEntrega5 &&fechaEntregaObj &&  fechaEntregaObj.getTime() <= fechaEntrega5.getTime()){
					fieldNameEntrega = 'custrecord30';
				}
				nlapiLogExecution( 'DEBUG', "fieldNameEntrega ","fieldNameEntrega: " + fieldNameEntrega);
				_cdc_vigencia_desde_esp	= nlapiStringToDate(_cdc_vigencia_desde_esp);
				_cdc_vigencia_hasta_esp = nlapiStringToDate(_cdc_vigencia_hasta_esp);				
				
				var tipoVenta = returnNumber(recordSO.getFieldValue('custbody_tipo_venta'));
				var TipoVentaPermitido 	= esTipoDeVentaPermitido(tipoVenta, _cdc_tipos_de_venta_permitido); 
				nlapiLogExecution( 'DEBUG', "TipoVentaPermitido ",TipoVentaPermitido);
				if(TipoVentaPermitido) {
					var totalAPagar = returnNumber(recordSO.getFieldValue('custbody_total_a_pagar'));
					var total 		= returnNumber(recordSO.getFieldValue('total'));
					var porcentaje  = 0.0;
					
					if(totalAPagar<=0) { 
						porcentaje	= 1;
					} else { 
						porcentaje = 1 - (totalAPagar / total);
					}
					porcentaje 	= 1;
					
					if((type!='xedit' && porcentaje >= 0.90)) {
						var salesRep     				= returnBlank(recordSO.getFieldValue('salesrep'));
						var salesRepText 				= returnBlank(recordSO.getFieldText('salesrep'));
						var entity       				= returnBlank(recordSO.getFieldValue('entity'));
						var _generar_comp_reclutamiento = returnFalse(recordSO.getFieldValue('custbody_generar_comp_reclutamiento'));
					    var fc 							= '';
//					    var fcNonZero 					= '';
					 	var filtersResCom  	        	= new Array();
					 	var columnsResCom 				= new Array();
					 	var resultsResCom 				= new Array(); 
					 	var filtersResComSup 	      	= new Array();
					 	var columnsResComSup 			= new Array();
					 	var resultsResComSup 			= new Array();
					 	var filtersResComRec   	    	= new Array();
					 	var columnsResComRec 			= new Array();
					 	var resultsResComRec 			= new Array();
					 	var filtersResComSplit 	    	= new Array();
					 	var columnsResComSplit 			= new Array();
					 	var resultsResComSplit 			= new Array();
						var cantVenta    				= 0;
						var series_tm    				= '';
						var cont						= 0;	
						var factFecMS    				= factFec.getTime();	
//						var factFecM     				= returnNumber(factFec.getMonth())+1;
//						var factFecY    	 			= factFec.getFullYear();
//						var filtersFC = [new nlobjSearchFilter('custrecord_year', null, 'equalto', factFecY)];
//						var resultsFechasCorte 	= returnBlank(nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFC, null));
						
//						if(resultsFechasCorte!='') {
						if(srchPeriods){
							
							var periodName = srchPeriods[0].getValue('name');
							fc = periodName;
							fc_complete = srchPeriods[0].getValue('custrecord_inicio');
//							fcNonZero = fc ;
//							var diaActualFechasCorte 	= resultsFechasCorte[0].getValue(('custrecord_mes_'+factFecM));
//							var fechaActualFechasCorte 	= new Date(factFecY, (factFecM-1), diaActualFechasCorte);
//							var mesActualFechasCorte 	= fechaActualFechasCorte.getMonth()+1;
//							var diaSignteFechasCorte 	= resultsFechasCorte[0].getValue(('custrecord_mes_'+(returnNumber(factFecM)+1)));
//							var fechaSignteFechasCorte 	= new Date(factFecY, (factFecM), diaSignteFechasCorte);
//							var mesSignteFechasCorte 	= fechaSignteFechasCorte.getMonth()+1;
//							
//							if(mesActualFechasCorte != mesSignteFechasCorte) {
//								
//								if(factFecMS <= fechaActualFechasCorte.getTime()) {
//									var mesActualFechasCorte = returnNumber(fechaActualFechasCorte.getMonth())+1;
//									if(mesActualFechasCorte < 10)  { 
//										fc = '0' + mesActualFechasCorte + '/' + fechaActualFechasCorte.getFullYear(); 
//									} else  { 
//										fc = mesActualFechasCorte + '/' + fechaActualFechasCorte.getFullYear(); 
//									}
//									fcNonZero = mesActualFechasCorte + '/' + fechaActualFechasCorte.getFullYear();
//								} else {
//									if(factFecMS <= fechaSignteFechasCorte.getTime()) {
//										var mesSignteFechasCorte = returnNumber(fechaSignteFechasCorte.getMonth())+1;
//										if(mesSignteFechasCorte < 10) { 
//											fc = '0'+mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear();
//										} else { 
//											fc = mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear();
//										}
//										fcNonZero = mesSignteFechasCorte+'/'+fechaSignteFechasCorte.getFullYear();
//									}
//								}
//							} else {
//								if(factFecMS <= fechaActualFechasCorte.getTime())  {
//									fc = '12/' + ( returnNumber(fechaSignteFechasCorte.getFullYear()));
//									fcNonZero = '12/' + ( returnNumber(fechaSignteFechasCorte.getFullYear()));	
//								} else {
//									var filtersFCSgte   			= new Array();
//										filtersFCSgte.push(new nlobjSearchFilter('custrecord_year', null, 'equalto', factFecY+1));
//									var resultsFechasCorteSgte 		= returnBlank(nlapiSearchRecord('customrecord_calendario_vorwerk', 'customsearch_compensaciones_so_cal_vor', filtersFCSgte, null));
//									if(resultsFechasCorteSgte!='') {
//										fc = '01/'+resultsFechasCorteSgte[0].getValue('custrecord_year');
//										fcNonZero = '1/'+resultsFechasCorteSgte[0].getValue('custrecord_year');
//									}
//								}
//							}
							
							var lines	= recordSO.getLineItemCount('item');
							
							for(var i=1; i<= lines;i++) {
								var item				= recordSO.getLineItemValue('item','item',i);
								var ArticuloPermtido 	= esArticuloPermitido(item, _cdc_articulos_permitidos); 
								if(ArticuloPermtido){
									cantVenta 	= returnNumber(recordSO.getLineItemValue('item','quantity',i));
									series_tm	= returnBlank(recordSO.getLineItemValue('item','serialnumbers',i));
									if(series_tm != '') {
										series_tm 	= stringToArray(series_tm,5);
									}
									break;
								}
							}
	
							if(salesRep != '' && cantVenta != 0 && fc != '') {
						    	var filtersEmp 		= new nlobjSearchFilter('internalid', null, 'is', salesRep);
								var columnsEmp 		= [new nlobjSearchColumn('custentity_reclutadora')];
								columnsEmp[1] 		= new nlobjSearchColumn('employeetype','custentity_reclutadora');
								columnsEmp[2] 		= new nlobjSearchColumn('custentity_promocion','custentity_reclutadora');
								columnsEmp[3] 		= new nlobjSearchColumn('custentity_fecha_inicio_split');
								columnsEmp[4] 		= new nlobjSearchColumn('custentity_fecha_fin_split');
								columnsEmp[5] 		= new nlobjSearchColumn('custentity_fin_objetivo_2');
								columnsEmp[6] 		= new nlobjSearchColumn('hiredate');
								columnsEmp[7] 		= new nlobjSearchColumn('custentity_cuenta_bancaria');
								columnsEmp[8] 		= new nlobjSearchColumn('custentity_nombre_unidad','custentity_reclutadora');
								columnsEmp[9]	 	= new nlobjSearchColumn('custentity72');
								columnsEmp[10] 		= new nlobjSearchColumn('custentity_fin_objetivo_2_reactivacion');
								columnsEmp[11] 		= new nlobjSearchColumn('custentity_no_venta_especial');
								var resultsEmp 			= returnBlank(nlapiSearchRecord('employee', null, filtersEmp, columnsEmp));
						        var catEmp 				= returnNumber(recordSO.getFieldValue('custbody_jerarquia'));
						        var esquema 			= returnNumber(recordSO.getFieldValue('custbody_esquema'));
						        var nombreUnidad 		= returnBlank(recordSO.getFieldValue('custbody_nombre_unidad'));
						        var reclu  				= returnBlank(resultsEmp[0].getValue('custentity_reclutadora'));
						        var recluCatEmp			= returnBlank(resultsEmp[0].getValue('employeetype','custentity_reclutadora'));
						        var recluEsqEmp			= returnBlank(resultsEmp[0].getValue('custentity_promocion','custentity_reclutadora'));
						        var recluNomUniEmp  	= returnBlank(resultsEmp[0].getValue('custentity_nombre_unidad','custentity_reclutadora'));
						        var fechaAlta 			= returnBlank(resultsEmp[0].getValue('hiredate'));
						        var fechaReact 			= returnBlank(resultsEmp[0].getValue('custentity72'));
						        var _no_venta_especial 	= returnNumber(resultsEmp[0].getValue('custentity_no_venta_especial'));
						        
						        if(fechaAlta!='') { 
						        	fechaAlta = nlapiStringToDate(fechaAlta);
						        }
						        
						        if(fechaReact!='')  { 
						        	fechaReact = nlapiStringToDate(fechaReact); 
						        }
						        
						        var fechaFinObj2	= returnBlank(resultsEmp[0].getValue('custentity_fin_objetivo_2'));
						        var fechaFinObj2Re	= returnBlank(resultsEmp[0].getValue('custentity_fin_objetivo_2_reactivacion'));
								
						        if(fechaFinObj2!='') { 
									fechaFinObj2 = nlapiStringToDate(fechaFinObj2);
								}
								
						        if(fechaFinObj2Re!='') { 
									fechaFinObj2Re = nlapiStringToDate(fechaFinObj2Re); 
								}
								var aplica_esquema_especial		= new Boolean();
								var _cdc_vigencia_desde_esp_ms	= _cdc_vigencia_desde_esp.getTime();
								var _cdc_vigencia_hasta_esp_ms	= _cdc_vigencia_hasta_esp.getTime();
								
								if((fechaAlta <= _cdc_vigencia_desde_esp_ms) && (factFecMS >= _cdc_vigencia_desde_esp_ms && factFecMS <= _cdc_vigencia_hasta_esp_ms)) {
									aplica_esquema_especial = true;
								} else {
									aplica_esquema_especial	= false;
								}
								
						        var cuentaBancaria  = returnBlank(resultsEmp[0].getValue('custentity_cuenta_bancaria'));
						        var jdgSplit 		= returnBlank(recordSO.getFieldValue('custbody_jefa_grupo_split'));
						        var supervisor		= returnBlank(recordSO.getFieldValue('custbody_jefa_grupo'));
						        var supervisorText 	= returnBlank(recordSO.getFieldText('custbody_jefa_grupo'));
						        var fis				= returnBlank((resultsEmp[0].getValue('custentity_fecha_inicio_split')));
						       
						        if(fis!='')  { 
						        	fis = nlapiStringToDate(fis); 
						        }
						        
						        var ffs	= returnBlank(resultsEmp[0].getValue('custentity_fecha_fin_split'));
						        if(ffs!='')  { 
						        	ffs = nlapiStringToDate(ffs); 
						        }
						        
						        var aplicadaGTM			= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_gtm'));
						        var aplicadaJDG			= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_jdg'));
						        var aplicadaPRE			= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_pre'));
						        var aplicadaREC			= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_rec'));
						        var aplicadaJDG_Split 	= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_jdg_split'));
						        var aplicadaJDG_Super 	= returnBlank(recordSO.getFieldValue('custbody_comision_aplicada_jdg_super'));
//						        var gtmId 				= 0;
						        var jdgId 				= 0;
						        var preId				= 0;
//						        var recId 				= 0;
//						        var jdgIdSplit 			= 0;
//						        var jdgIdSup 			= 0;  
						        nlapiLogExecution( 'DEBUG', "esquema ", 'esquema: ' + esquema + ' | _cdc_ventas_minimas_txtm: ' + _cdc_ventas_minimas_txtm );	
						        if(esquema == 1  && _cdc_ventas_minimas_txtm != 0)  {
//						        	nlapiLogExecution( 'DEBUG', "aplicadaGTM ", aplicadaGTM );	
						        	if(aplicadaGTM=='') {
										var ventasTotalesGTM = 0;
										//var importeAcumulado = 0;
										var cantVentaPeriodo = 0;
												
						        		if(fechaAlta!='') { 
											var fechaAltaMS 	= returnNumber(fechaAlta.getTime());
//											var fc_complete = fechaAlta.getDate()+ '/' +fcNonZero;
											fc_complete = nlapiStringToDate(fc_complete);
											var fc_completeMS	= returnNumber(fc_complete.setDate(fechaAlta.getDate()));//returnNumber(fc_complete.getTime());
											
											while(fc_completeMS>=fechaAltaMS) {
												var fcAux = (returnNumber(fc_complete.getMonth()) + 1) + '/' + fc_complete.getFullYear();
												fcAux = fcAux.split('/');
												
												if(returnNumber(fcAux[0])<10) { 
													fcAux[0] = '0'+fcAux[0];
												}
												
												fcAux = fcAux.join('/');
												var	filtersResComAux = new Array();
												filtersResComAux[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep);
									        	filtersResComAux[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fcAux);
									        												        	
									        	//-- custrecord9 -> Cï¿½digo de Configuraciï¿½n de comisiones
									        	filtersResComAux[2] = new nlobjSearchFilter('custrecord12', null, 'is', recordConfCompId);
										        	
												var columnsResComAux = new Array();
												columnsResComAux[0] = new nlobjSearchColumn('custrecord_gtm_no_ventas_totales');
												columnsResComAux[1] = new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
												columnsResComAux[2] = new nlobjSearchColumn('custrecord_gtm_total_comisiones');
												var resultsResComAux = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersResComAux, columnsResComAux));
												
												if(resultsResComAux!='') {
													cantVentaPeriodo = returnNumber(resultsResComAux[0].getValue('custrecord_gtm_no_ventas_periodo'));
													ventasTotalesGTM = returnNumber(resultsResComAux[0].getValue('custrecord_gtm_no_ventas_totales'));
													
													if(ventasTotalesGTM == (_cdc_ventas_minimas_txtm - 1)) {
														nlapiSubmitField('employee',salesRep,['custentity_promocion','custentity_se_fecha_conversion'],[2, nlapiDateToString(new Date())]);
														var filtersResComRec_GTM= new Array();
														filtersResComRec_GTM[0] = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', salesRep);
														filtersResComRec_GTM[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
														filtersResComRec_GTM[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora', null, 'is', 1);
														
														//-- custrecord11 -> Cï¿½digo de Configuraciï¿½n de comisiones
														filtersResComRec_GTM[3] = new nlobjSearchFilter('custrecord11', null, 'is', recordConfCompId);
																												        	
														var columnsResComRec_GTM= new Array();
														columnsResComRec_GTM[0] = new nlobjSearchColumn('custrecord_rec_reclutadora');
														columnsResComRec_GTM[1] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
														columnsResComRec_GTM[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
														
														var resultsResComRec_GTM	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec_GTM, columnsResComRec_GTM));
														
														if(resultsResComRec_GTM != '') {
															var resultsResComRec_GTM_IDS = new Array();
															
															for(var i=0;i<resultsResComRec_GTM.length;i++) {
																resultsResComRec_GTM_IDS[i] = resultsResComRec_GTM[i].getId();
																nlapiSubmitField('customrecord_comisiones_rec', resultsResComRec_GTM_IDS[i], 'custrecord_rec_esquema_reclutadora', 2);
															}
														}	
													}
													//importeAcumulado = (returnNumber(resultsResComAux[0].getValue('custrecord_gtm_total_comisiones')));
													break;
												}
												fc_complete = nlapiAddMonths(fc_complete,(-1));
												fc_completeMS	= returnNumber(fc_complete.getTime());
											}
										} 
								        		
							        	filtersResCom[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep);
							        	filtersResCom[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc);
							        	
							        	//-- custrecord9 -> Cï¿½digo de Configuraciï¿½n de comisiones
							        	filtersResCom[2] = new nlobjSearchFilter('custrecord12', null, 'is', recordConfCompId);
							        										        										        	
										columnsResCom[0] = new nlobjSearchColumn('custrecord_gtm_no_ventas_totales');
										columnsResCom[1] = new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo');
										columnsResCom[2] = new nlobjSearchColumn('custrecord_gtm_fecha_comision');
										resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filtersResCom, columnsResCom));
										        
										//-- Busqueda del monto de compensación
										var filtersEVTXTM = [new nlobjSearchFilter('custrecord_esq_ventas_txtm_no_venta', null, 'lessthanorequalto', (cantVenta+ventasTotalesGTM)),
															new nlobjSearchFilter('custrecord_esq_ventas_txtm_conf_comp', null, 'is', recordConfComp.id)];
										var _compensaciones_so_evtxtm = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_txtm', 'customsearch_compensaciones_so_evtxtm', filtersEVTXTM, null));
										var _gtm_total_comisiones = returnNumber(_compensaciones_so_evtxtm[0].getValue('custrecord_esq_ventas_txtm_compensacion',null,'SUM'));
										var _gtm_internalid	= returnNumber(_compensaciones_so_evtxtm[0].getValue('internalid',null,'GROUP'));
										var _gtm_retener_comp	= returnFalse(nlapiLookupField('customrecord_esq_ventas_txtm', _gtm_internalid, 'custrecord_esq_ventas_txtm_retener', false));
										
										//-- Busqueda del monto de compensación unitario
//										var filterUni = [new nlobjSearchFilter('custrecord_esq_ventas_txtm_no_venta', null, 'lessthanorequalto', 1),
//															new nlobjSearchFilter('custrecord_esq_ventas_txtm_conf_comp', null, 'is', recordConfComp.id)];
//										var _compensacionesUni = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_txtm', 'customsearch_compensaciones_so_evtxtm', filterUni, null));
//										var compensacionXUnidad = returnNumber(_compensacionesUni[0].getValue('custrecord_esq_ventas_txtm_compensacion',null,'SUM'));
										var _compensacionesUni = _gtm_total_comisiones;
										//--Otras variables
										var _gtm_puesta_marcha = 0;
										var RecComisionesGTM = null;
										nlapiLogExecution( 'DEBUG', "ventasTotalesGTM < _cdc_ventas_minimas_txtm ", ventasTotalesGTM + " < " + _cdc_ventas_minimas_txtm );
										
										if(resultsResCom=='')  {
											nsaciones_so_evtxtm = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_txtm', 'customsearch_compensaciones_so_evtxtm', filtersEVTXTM, null));
								        	
											if(ventasTotalesGTM < _cdc_ventas_minimas_txtm) {
												RecComisionesGTM = nlapiCreateRecord('customrecord_comisiones_gtm');
												RecComisionesGTM.setFieldValue('custrecord_gtm_empleado',salesRep);								                
												RecComisionesGTM.setFieldValue('custrecord_gtm_nombre_empleado',salesRepText);
												RecComisionesGTM.setFieldValue('custrecord_gtm_cuenta_bancaria',cuentaBancaria);
												RecComisionesGTM.setFieldValue('custrecord_gtm_nombre_unidad',nombreUnidad);
												RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_totales',cantVenta+ventasTotalesGTM);
												RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_periodo',cantVenta);
												RecComisionesGTM.setFieldValue('custrecord_gtm_puesta_marcha',_gtm_puesta_marcha);
											    RecComisionesGTM.setFieldValue('custrecord_gtm_total_comisiones',_gtm_total_comisiones);
											    RecComisionesGTM.setFieldValue('custrecord_gtm_rentener_compensaciones',_gtm_retener_comp);
											    RecComisionesGTM.setFieldValue('custrecord_gtm_fecha_comision',fc);
											    RecComisionesGTM.setFieldValue('custrecord_gtm_bono_manual',0.0);
											    
											    RecComisionesGTM.setFieldValue('custrecord22', acumulaPuntos?'T':'F');
											    RecComisionesGTM.setFieldValue('custrecord23', acumulaPuntos?conversion:'');
											    
											}
								        } else {
								        	
								        	if(ventasTotalesGTM < _cdc_ventas_minimas_txtm) {									        		
								        		var filtersEVTXTM = [new nlobjSearchFilter('custrecord_esq_ventas_txtm_no_venta', null, 'equalto', (cantVenta+ventasTotalesGTM)),
								 									 new nlobjSearchFilter('custrecord_esq_ventas_txtm_conf_comp', null, 'is', recordConfCompId)];
												var columnsEVTXTM = [new nlobjSearchColumn('internalid',null,'GROUP')];
												var _compensaciones_so_evtxtm 	= returnBlank(nlapiSearchRecord('customrecord_esq_ventas_txtm', 'customsearch_compensaciones_so_evtxtm', filtersEVTXTM, columnsEVTXTM));
								        		var _gtm_internalid		= returnNumber(_compensaciones_so_evtxtm[0].getValue('internalid',null,'GROUP'));
								        		var _gtm_retener_comp	= returnFalse(nlapiLookupField('customrecord_esq_ventas_txtm', _gtm_internalid, 'custrecord_esq_ventas_txtm_retener', false));
								        		
								        		RecComisionesGTM = nlapiLoadRecord('customrecord_comisiones_gtm',resultsResCom[0].getId());
								        		
								        		var totalComisionActual = RecComisionesGTM.getFieldValue('custrecord_gtm_total_comisiones');
								        		_compensacionesUni = _gtm_total_comisiones - totalComisionActual;
								        			
							        			RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_totales',returnNumber(ventasTotalesGTM)+returnNumber(cantVenta));
							        			RecComisionesGTM.setFieldValue('custrecord_gtm_no_ventas_periodo',returnNumber(cantVenta)+returnNumber(cantVentaPeriodo));
							        			RecComisionesGTM.setFieldValue('custrecord_gtm_puesta_marcha',_gtm_puesta_marcha);
							        			RecComisionesGTM.setFieldValue('custrecord_gtm_total_comisiones',(_gtm_total_comisiones));// + returnNumber(importeAcumulado));
							        			RecComisionesGTM.setFieldValue('custrecord_gtm_rentener_compensaciones',_gtm_retener_comp);
											}
										}
										nlapiLogExecution( 'DEBUG', "RecComisionesGTM ", RecComisionesGTM );
//								        if(gtmId !=0 ) { 
										if(RecComisionesGTM) { 
											//Guarda el enlace de la comision en la sales order
											if(!isSaved){
												nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
												isSaved = true;
											}
											
											RecComisionesGTM.setFieldValue('custrecord12',recordConfCompId);
								        	var newRecComisionesGTMId = nlapiSubmitRecord(RecComisionesGTM, true, true);
										
											for(cont=0;cont<cantVenta;cont++) {
									        	var newRecComisionesDetGTM = nlapiCreateRecord('customrecord_comisiones_gtm_det');
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_empleado_id',salesRep);
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_comision_gtm_id',newRecComisionesGTMId);
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_factura',recordId);
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_serie_tm',returnBlank(series_tm[cont]));
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_venta_realizada_por',salesRep);
									        	newRecComisionesDetGTM.setFieldValue('custrecord_gtm_det_cliente',entity);
									        	newRecComisionesDetGTM.setFieldValue('custrecord40',_compensacionesUni);
									        	nlapiSubmitRecord(newRecComisionesDetGTM, true, true);
									        }
											
											if(ventasTotalesGTM == (_cdc_ventas_minimas_txtm -1 )) {
												nlapiSubmitField('employee',salesRep,['custentity_promocion','custentity_se_fecha_conversion'],[2, nlapiDateToString(new Date())]);
												var filtersResComRec_GTM	= new Array();
												filtersResComRec_GTM[0] = new nlobjSearchFilter('custrecord_rec_reclutadora', null, 'is', salesRep);
												filtersResComRec_GTM[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
												filtersResComRec_GTM[2] = new nlobjSearchFilter('custrecord_rec_esquema_reclutadora', null, 'is', 1);
												
												//-- custrecord11 -> Cï¿½digo de Configuraciï¿½n de comisiones
												filtersResComRec_GTM[3] = new nlobjSearchFilter('custrecord11', null, 'is', recordConfCompId);
																												
												var columnsResComRec_GTM	= new Array();
												columnsResComRec_GTM[0] = new nlobjSearchColumn('custrecord_rec_reclutadora');
												columnsResComRec_GTM[1] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
												columnsResComRec_GTM[2] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
												var resultsResComRec_GTM	= returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec_GTM, columnsResComRec_GTM));
												
												if(resultsResComRec_GTM != '') {
													var resultsResComRec_GTM_IDS = new Array();
													for(var i=0;i<resultsResComRec_GTM.length;i++) {
														resultsResComRec_GTM_IDS[i] = resultsResComRec_GTM[i].getId();
														nlapiSubmitField('customrecord_comisiones_rec', resultsResComRec_GTM_IDS[i], 'custrecord_rec_esquema_reclutadora', 2);
													}
                                                  
                                                  //-- Valida agrupaciones princial y acumula (REC)
											        if(configuracionPrincipal && !acumulaPuntos){
											        	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
											        	var filters =[new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep), 
											        				  new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc),
											        				  new nlobjSearchFilter('custrecord11', null, 'is', configuracionPrincipal.id)];
											        	
														var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_rec', null, filters);
														var objAcumulador = null;
														nlapiLogExecution( 'DEBUG', "rsltAcumuladorPrincipal ", JSON.stringify(rsltAcumuladorPrincipal) );
														if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
															objAcumulador = nlapiLoadRecord('customrecord_comisiones_rec', rsltAcumuladorPrincipal[0].id);
														} else {
															objAcumulador = nlapiCreateRecord('customrecord_comisiones_rec');
															objAcumulador.setFieldValue('custrecord_rec_empleado',salesRep);
															objAcumulador.setFieldValue('custrecord11', configuracionPrincipal.id);
															objAcumulador.setFieldValue('custrecord_rec_nombre_empleado',salesRepText);
															objAcumulador.setFieldValue('custrecord_rec_fecha_comision',fc);
														}
                                                      
                                                     	objAcumulador.setFieldValue('custrecord_rec_reclutadora',reclu);
														objAcumulador.setFieldValue('custrecord_rec_categoria_empleado',recluCatEmp);
														objAcumulador.setFieldValue('custrecord_rec_esquema_reclutadora',recluEsqEmp);
										                
														//- Busca el total de comisiones generadas											
														var filters =[new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep), 
									        				  new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc),
									        				  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord11', 'is', 'F')];
														
														if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
															filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
														}
									        	
														var columns = [new nlobjSearchColumn('custrecord_rec_no_ventas_totales', null, 'sum'),
																	   new nlobjSearchColumn('custrecord_rec_no_ventas_periodo', null, 'sum'),
																	   new nlobjSearchColumn('custrecord_rec_desde_periodo', null, 'sum'),
																	   new nlobjSearchColumn('custrecord_rec_total_comisiones', null, 'sum'),
																	   new nlobjSearchColumn('custrecord_rec_bono_manual', null, 'sum')];
														
														var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns);											
														nlapiLogExecution( 'DEBUG', "rsltComisionGroup ", rsltComisionGroup );
														objAcumulador.setFieldValue('custrecord_rec_no_ventas_totales', rsltComisionGroup[0].getValue(columns[0]));
														objAcumulador.setFieldValue('custrecord_rec_no_ventas_periodo', rsltComisionGroup[0].getValue(columns[1]));
														objAcumulador.setFieldValue('custrecord_rec_desde_periodo', rsltComisionGroup[0].getValue(columns[2]));
														objAcumulador.setFieldValue('custrecord_rec_total_comisiones', rsltComisionGroup[0].getValue(columns[3]));
														objAcumulador.setFieldValue('custrecord_rec_bono_manual', rsltComisionGroup[0].getValue(columns[4]));
														nlapiSubmitRecord(objAcumulador, true, true);
														nlapiLogExecution( 'DEBUG', "objAcumulador ", JSON.stringify(objAcumulador) );
											        }
												}						
											}
						            		nlapiSubmitField(recordType,recordId,'custbody_comision_aplicada_gtm',newRecComisionesGTMId); 
						            	}
										        
								        //-- Valida agrupaciones princial y acumula (GTM)
								        if(configuracionPrincipal && !acumulaPuntos){
								        	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
								        	var filters =[new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep), 
								        				  new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc),
								        				  new nlobjSearchFilter('custrecord12', null, 'is', configuracionPrincipal.id)];
								        	
											var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_gtm', null, filters);
											var objAcumulador = null;
											nlapiLogExecution( 'DEBUG', "rsltAcumuladorPrincipal ", JSON.stringify(rsltAcumuladorPrincipal) );
											if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
												objAcumulador = nlapiLoadRecord('customrecord_comisiones_gtm', rsltAcumuladorPrincipal[0].id);
											} else {
												objAcumulador = nlapiCreateRecord('customrecord_comisiones_gtm');
												objAcumulador.setFieldValue('custrecord_gtm_empleado',salesRep);
												objAcumulador.setFieldValue('custrecord12', configuracionPrincipal.id);
												objAcumulador.setFieldValue('custrecord_gtm_nombre_empleado',salesRepText);
												objAcumulador.setFieldValue('custrecord_gtm_fecha_comision',fc);
											}
											
											//- Busca el total de comisiones generadas											
											var filters =[new nlobjSearchFilter('custrecord_gtm_empleado', null, 'is', salesRep), 
						        				  new nlobjSearchFilter('custrecord_gtm_fecha_comision', null, 'is', fc),
						        				  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord12', 'is', 'F')];
											
											if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
												filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
											}
											 
											var columns = [new nlobjSearchColumn('custrecord_gtm_no_ventas_totales', null, 'sum'),
														   new nlobjSearchColumn('custrecord_gtm_no_ventas_periodo', null, 'sum'),
														   new nlobjSearchColumn('custrecord_gtm_total_comisiones', null, 'sum'),
														   new nlobjSearchColumn('custrecord_gtm_bono_manual', null, 'sum'),
														   new nlobjSearchColumn('custrecord_gtm_puesta_marcha', null, 'sum')];
											
											var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns);											
											nlapiLogExecution( 'DEBUG', "rsltComisionGroup ", rsltComisionGroup );
											objAcumulador.setFieldValue('custrecord_gtm_no_ventas_totales', rsltComisionGroup[0].getValue(columns[0]));
											objAcumulador.setFieldValue('custrecord_gtm_no_ventas_periodo', rsltComisionGroup[0].getValue(columns[1]));
											objAcumulador.setFieldValue('custrecord_gtm_total_comisiones', rsltComisionGroup[0].getValue(columns[2]));
											objAcumulador.setFieldValue('custrecord_gtm_bono_manual', rsltComisionGroup[0].getValue(columns[3]));
											objAcumulador.setFieldValue('custrecord_gtm_puesta_marcha', rsltComisionGroup[0].getValue(columns[4]));
											nlapiSubmitRecord(objAcumulador, true, true);
											nlapiLogExecution( 'DEBUG', "objAcumulador ", JSON.stringify(objAcumulador) );
								        }
								        
								     
		//											}
		//										}
							        }
							    } else if(esquema == 1  && _cdc_ventas_minimas_txtm == 0){
							    	nlapiLogExecution( 'DEBUG', "Cambio de esquema", '******************************************' );
							    	esquema= 2;
							    	nlapiSubmitField(recordType,recordId,'custbody_esquema',2); 
							    }

						        
						        if(esquema == 2 && !aplicadaGTM){
							    	nlapiLogExecution( 'DEBUG', "catEmp", catEmp );
							        switch(catEmp) {
							        	case 3: //Jefa de Grupo
							        	{
//							        		if(aplicadaJDG == '') {
							        		var RecComisionesJdG = null;
							        		
							        		filtersResCom[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep);
								        	filtersResCom[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
								        	filtersResCom[2] = new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId);
								        	
						        			if(aplica_esquema_especial == true && _no_venta_especial < _cdc_ventas_maximas_esp) {									        	
								     			columnsResCom[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_propio');
								     			columnsResCom[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
								     			columnsResCom[2] = new nlobjSearchColumn('custrecord_jdg_no_ventas_esp_periodo');
								     			columnsResCom[3] = new nlobjSearchColumn('custrecord_jdg_no_ventas_esp_acumulado');
								     			columnsResCom[4] = new nlobjSearchColumn('custrecord_jdg_compensacion_propio');
								     			columnsResCom[5] = new nlobjSearchColumn('custrecord_jdg_entrega_propio');
								     			resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResCom, columnsResCom));
								     			
								     			var _esq_ventas_esp_compensacion = 0;
								     			
								     			//-- Calculo de compensación unitaria
								     			var compJDGUni = 0;
								     	        if(resultsResCom=='')  {
								     	        	var _jdg_no_ventas_esp_acumulado_GLOBAL	= 0;
								        			var filtersEVE_acumulado = [new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep),
				    									  					 	new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId)];
						        					var _compensaciones_so_evjdg_acumulado 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', 'customsearch_comp_so_eve_acumu_jdg', filtersEVE_acumulado, null));
						        					
						        					if(_compensaciones_so_evjdg_acumulado != '') {
						        						_jdg_no_ventas_esp_acumulado_GLOBAL	= returnNumber(_compensaciones_so_evjdg_acumulado[0].getValue('custrecord_jdg_no_ventas_esp_acumulado'));	
						        					}
						        					
								        			var desde = _jdg_no_ventas_esp_acumulado_GLOBAL;
								        			var hasta = cantVenta + _jdg_no_ventas_esp_acumulado_GLOBAL; 
							    					var filtersEVE = [new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', hasta),
							    									  new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'greaterthan', desde),
							    									  new nlobjSearchFilter('custrecord_esq_ventas_esp_conf_comp', null, 'is', recordConfCompId)];
						        					var _compensaciones_so_evjdg 	= returnBlank(nlapiSearchRecord('customrecord_esq_ventas_esp', 'customsearch_compensaciones_so_eve', filtersEVE, null));
						        					_esq_ventas_esp_compensacion= returnNumber(_compensaciones_so_evjdg[0].getValue('custrecord_esq_ventas_esp_compensacion',null,'SUM'));
						        					RecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_empleado',salesRep);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_propio',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',_esq_ventas_esp_compensacion);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_esp_periodo',cantVenta);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_esp_acumulado',hasta);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_especial',_esq_ventas_esp_compensacion);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_x_maquina_propio',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
												    compJDGUni = _esq_ventas_esp_compensacion;
												    nlapiLogExecution( 'DEBUG', "compJDGUni", compJDGUni);
//												    var newRecComisionesJdGId = nlapiSubmitRecord(newRecComisionesJdG, true, true);
								     				nlapiSubmitField('employee', salesRep, 'custentity_no_venta_especial', hasta);
								     	        }  else { 
								     	        	
									     			var _jdg_no_ventas_esp_periodo 		= returnNumber(resultsResCom[0].getValue('custrecord_jdg_no_ventas_esp_periodo'));
									     			var _jdg_no_ventas_esp_acumulado 	= returnNumber(resultsResCom[0].getValue('custrecord_jdg_no_ventas_esp_acumulado'));
									     			var _jdg_compensacion_propio		= returnNumber(resultsResCom[0].getValue('custrecord_jdg_compensacion_propio'));
									     			var _jdg_entrega_propio	= returnNumber(resultsResCom[0].getValue('custrecord_jdg_entrega_propio'));
									     			var esquema_ventas_jdg				= _jdg_compensacion_propio + _jdg_entrega_propio; 
								        			var desde = 0;
								        			var hasta = 0;
							    					var filtersEVE = [new nlobjSearchFilter('custrecord_esq_ventas_esp_conf_comp', null, 'is', recordConfCompId)];
						        					var _compensaciones_so_evjdg 		= new Object();
//						        					var _esq_ventas_esp_compensacion 	= 0;
						        					
						        					nlapiLogExecution( 'debug', '_jdg_no_ventas_esp_acumulado == _jdg_no_ventas_esp_periodo', _jdg_no_ventas_esp_acumulado + ' - ' + _jdg_no_ventas_esp_periodo);
						        					if(_jdg_no_ventas_esp_acumulado == _jdg_no_ventas_esp_periodo) {
								    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', (_jdg_no_ventas_esp_acumulado + cantVenta)));
									        		} else {
									        			var filtersEVE_acumulado = [new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep),
									        										new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId)];
							        					var _compensaciones_so_evjdg_acumulado = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', 'customsearch_comp_so_eve_acumu_jdg', filtersEVE_acumulado, null));
									        			desde = returnNumber(_compensaciones_so_evjdg_acumulado[0].getValue('custrecord_jdg_no_ventas_esp_acumulado'));
									        			hasta = (_jdg_no_ventas_esp_acumulado + cantVenta);
								    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', hasta));
								    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'greaterthanorequalto', desde));								        					
									        		}
						        					nlapiLogExecution( 'debug', '_jdg_no_ventas_esp_acumulado out.', _jdg_no_ventas_esp_acumulado + ' - ' + _jdg_no_ventas_esp_periodo);
						        					
						        					_compensaciones_so_evjdg = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_esp', 'customsearch_compensaciones_so_eve', filtersEVE, null));
						        					_esq_ventas_esp_compensacion = returnNumber(_compensaciones_so_evjdg[0].getValue('custrecord_esq_ventas_esp_compensacion',null,'SUM'));
						        					
						        					
//									        		var RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResCom[0].getId());
						        					RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResCom[0].getId());
						        					
						        					var totalComActual = RecComisionesJdG.getFieldValue('custrecord_jdg_total_comisiones_propio');
						        					compJDGUni = _esq_ventas_esp_compensacion + esquema_ventas_jdg - totalComActual;
						        					nlapiLogExecution( 'DEBUG', "compJDGUni", "_esq_ventas_esp_compensacion: " + _esq_ventas_esp_compensacion + 
						        							" + esquema_ventas_jdg: " + esquema_ventas_jdg+ " - totalComActual:" + totalComActual + " = " + compJDGUni);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_propio',0);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio',0);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_x_maquina_propio',0);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',_esq_ventas_esp_compensacion + esquema_ventas_jdg);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_esp_periodo',(_jdg_no_ventas_esp_periodo + cantVenta));
										            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_esp_acumulado',(_jdg_no_ventas_esp_acumulado + cantVenta));
										            RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_especial',_esq_ventas_esp_compensacion);
										            nlapiLogExecution( 'debug', imain + ' 2.0 RecComisionesJdG', JSON.stringify(RecComisionesJdG));
										            
//											        var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG, true, true);
								    		        nlapiSubmitField('employee', salesRep, 'custentity_no_venta_especial', (_jdg_no_ventas_esp_acumulado + cantVenta));
								     	        }
								     	        
								     	        if(RecComisionesJdG){													
								     	        	RecComisionesJdG.setFieldValue('custrecord9',recordConfCompId);
								     	        	jdgId = nlapiSubmitRecord(RecComisionesJdG, true, true);
								     	        	//-- Para que no cree lineas cada ves
								    		        if(aplicadaJDG == '') {
														for(cont=0;cont<cantVenta;cont++) {
															var newRecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
											        		newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',salesRep);
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id', jdgId);
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',recordId);
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',returnBlank(series_tm[cont]));
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_esquema_venta_especia','T');
												        	newRecComisionesDetJdG.setFieldValue('custrecord_jdg_det_total',compJDGUni);
												        	nlapiSubmitRecord(newRecComisionesDetJdG, true, true);
														}
								    		        }
								     	        }
						        			} else {
												columnsResCom[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_propio');
												columnsResCom[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
												columnsResCom[2] = new nlobjSearchColumn('custrecord_jdg_compensacion_especial');
												resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResCom, columnsResCom));
												nlapiLogExecution( 'DEBUG', "resultsResCom ", resultsResCom );
												
												var _esq_ventas_pre_compensacion 	= 0;
								        		var _esq_ventas_pre_entrega 		= 0;
								        		var _esq_ventas_pre_total 			= 0;
								        		var _esq_ventas_pre_x_maquina 		= 0;
								        		
								        		var columnsEVP = [
								        			new nlobjSearchColumn('custrecord_esq_ventas_pre_compensacion'),
								        			new nlobjSearchColumn(fieldNameEntrega),
//								        			new nlobjSearchColumn('custrecord_esq_ventas_pre_total'),
								        			new nlobjSearchColumn('custrecord_esq_ventas_pre_x_maquina'),
								        			new nlobjSearchColumn('custrecord_esq_ventas_pre_bono')];
								        		
								        		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
								        		
								        		//-- Calculo de monto de compensación unitario
								        		var preBono = 0;
								        		var preBonoDetalle = 0 ;
								        		var _jdg_no_entregas = 0;
								        		var preEntregaDetalle = 0;
								        		var compesacionUni = 0;
								        		
								        		
										        if(resultsResCom=='')  {
										        	//--calculo de monto de entrega
										        	filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', (fechaEntrega?cantVenta:0));
						        					var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP));
						        					
						        					///-Calculo de monto de venta
						        					filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1);
						        					var _compensaciones_so_evpreVta = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP);
						        					
						        					if(_compensaciones_so_evpre != '') {
						        						var EVP = _compensaciones_so_evpre[0];
						        						_esq_ventas_pre_compensacion = returnNumber(EVP.getValue(columnsEVP[0]));
										        		_esq_ventas_pre_entrega = returnNumber(EVP.getValue(columnsEVP[1]));
										        		_esq_ventas_pre_total = _compensaciones_so_evpreVta ? Number(_compensaciones_so_evpreVta[0].getValue(columnsEVP[0])):0;
//										        		_esq_ventas_pre_total 	= returnNumber(EVP.getValue(columnsEVP[2]));
										        		_esq_ventas_pre_x_maquina = returnNumber(EVP.getValue(columnsEVP[2]));	
										        		preBono = _compensaciones_so_evpreVta ? Number(_compensaciones_so_evpreVta[0].getValue(columnsEVP[3])):0;
						        					}
						        					RecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');										        	
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_empleado',salesRep);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
									                RecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
									                RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
									                RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio', 1);//(fechaEntrega?cantVenta:0));
												    RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',_esq_ventas_pre_total);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',0);
												    RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',0);
						    					    RecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);												    
												    RecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
												    compesacionUni = _esq_ventas_pre_total;
												    preBonoDetalle = preBono;
												    preEntregaDetalle = fechaEntregaObj? _esq_ventas_pre_entrega : 0;
												    _esq_ventas_pre_entrega = fechaEntregaObj? 1 : 0;
												    nlapiLogExecution( 'DEBUG', "compesacionUni ", compesacionUni);
										        }  else {
										        	var _pre_compensacion_especial = returnNumber(resultsResCom[0].getValue('custrecord_jdg_compensacion_especial'));
										        	
										        	//---------------------------------------------
										        	//-- Calcula la cantidad de ventas
						        					var columnCountEntrega = new nlobjSearchColumn('custrecord_jdg_det_factura', null, 'count');
						        					var filterCountVentaPropio = [	['custrecord_jdg_det_comision_jdg_id','is', resultsResCom[0].getId()], 'and', 
						        												['custrecord_jdg_det_venta_realizada_por','anyof',salesRep], 'and',
						        												['custrecord_jdg_det_factura','noneof', nlapiGetRecordId()]];
        					
						        					var searchCantEntega = nlapiSearchRecord('customrecord_comisiones_jdg_det',null, filterCountVentaPropio, columnCountEntrega);
						        					var _jdg_no_ventas_propio = Number(searchCantEntega[0].getValue(columnCountEntrega)) + 1;
						        					filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  _jdg_no_ventas_propio );
						        					
						        					var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP);
						        					
						        					if(_compensaciones_so_evpre) {					
						        						var EVP = _compensaciones_so_evpre[0];
						        						_esq_ventas_pre_compensacion 	= returnNumber(EVP.getValue(columnsEVP[0]));
						        						_esq_ventas_pre_total 	= returnNumber(EVP.getValue(columnsEVP[0]));
//										        		_esq_ventas_pre_total = returnNumber(EVP.getValue(columnsEVP[2]));
										        		_esq_ventas_pre_x_maquina = returnNumber(EVP.getValue(columnsEVP[2]));
										        		preBono = Number(EVP.getValue(columnsEVP[3]));
						        					}
						        					
						        					RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResCom[0].getId());
						        					
						        					//---------------------------------------------
						        					///-- Calculo de entrega
						        					if(fechaEntrega){
							        					var filterCountEntrega = [	['custrecord_jdg_det_comision_jdg_id','is', resultsResCom[0].getId()], 'and', 
							        												['custrecord_jdg_det_factura.custbody_fcha_entrega_tm5_cliente','isnotempty',''], 'and', 
							        												['custrecord_jdg_det_venta_realizada_por','anyof',salesRep], 'and',
							        					                            //['custrecord_jdg_det_factura.custbody_jerarquia','is','3'], 'and', 
							        					                            ['custrecord_jdg_det_factura.mainline','is','T']];
							        					
							        					if(fechaEntrega){
							        						filterCountEntrega.push('and');
							        						filterCountEntrega.push(['custrecord_jdg_det_factura','noneof', nlapiGetRecordId()]);
							        					}
							        					
							        					searchCantEntega = nlapiSearchRecord('customrecord_comisiones_jdg_det',null, filterCountEntrega , columnCountEntrega);
							        					_jdg_no_entregas = Number(searchCantEntega[0].getValue(columnCountEntrega)) + 1;
							        					filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  _jdg_no_entregas );
							        					
							        					var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP);
							        					
							        					if(_compensaciones_so_evpre) {					
							        						var EVP = _compensaciones_so_evpre[0];
											        		_esq_ventas_pre_entrega = returnNumber(EVP.getValue(columnsEVP[1]));
							        					}
						        					} else {
						        						_jdg_no_entregas = RecComisionesJdG.getFieldValue('custrecord_jdg_nro_entregas_propios');
						        						_esq_ventas_pre_entrega = RecComisionesJdG.getFieldValue('custrecord_jdg_entrega_propio');
						        					}
						        					//------------------------------------------------
						        					nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", '_esq_ventas_pre_entrega  A: ' +  Number(searchCantEntega[0].getValue(columnCountEntrega)) );
						        					nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", '_esq_ventas_pre_entrega: ' + _esq_ventas_pre_entrega  + ' _jdg_no_entregas: ' + _jdg_no_entregas  + ' _jdg_no_ventas_propio: ' + _jdg_no_ventas_propio);
						        					
									        		
									        		
									        		//-- Monto de entrega por detalle
									        		var montoEntregaAnterior =  RecComisionesJdG.getFieldValue('custrecord_jdg_entrega_propio');
									        		preEntregaDetalle = fechaEntregaObj ? _esq_ventas_pre_entrega - montoEntregaAnterior : 0;
									        		nlapiLogExecution( 'DEBUG', "preEntregaDetalle ", preEntregaDetalle);
									        		
									        		//---- Compensación por detalle
									        		var totalComActual =  RecComisionesJdG.getFieldValue('custrecord_jdg_total_comisiones_propio');
						        					compesacionUni = _esq_ventas_pre_total + _pre_compensacion_especial - totalComActual;
						        					nlapiLogExecution( 'DEBUG', "compesacionUni ", _esq_ventas_pre_total +  " + " + _pre_compensacion_especial + " - " + totalComActual + " = " + compesacionUni);
										           
						        					var bonoPropioActual =  RecComisionesJdG.getFieldValue('custrecord_jdg_bono_propio');
						        					preBonoDetalle = preBono - bonoPropioActual;
						        					
						        					nlapiLogExecution( 'DEBUG', "_jdg_no_ventas_propio ", _jdg_no_ventas_propio);
						        					RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',_jdg_no_ventas_propio);
										            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',_esq_ventas_pre_total + _pre_compensacion_especial);
										        }
										        
										        if(RecComisionesJdG){
							        				RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_propio',_esq_ventas_pre_compensacion);
							        				RecComisionesJdG.setFieldValue('custrecord_jdg_x_maquina_propio',_esq_ventas_pre_x_maquina);
							        				RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio', _esq_ventas_pre_entrega);
							        				RecComisionesJdG.setFieldValue('custrecord_jdg_nro_entregas_propios', _jdg_no_entregas);
							        				RecComisionesJdG.setFieldValue('custrecord9',recordConfCompId);
							        				RecComisionesJdG.setFieldValue('custrecord_jdg_bono_propio', preBono);
							        				jdgId = nlapiSubmitRecord(RecComisionesJdG, true, true);
							        				
							        				var periodoEntrega = fechaEntregaObj ? ("0"+(fechaEntregaObj.getMonth()+1)).slice(-2) + "/" +fechaEntregaObj.getFullYear(): null;
							    		        	nlapiLogExecution( 'DEBUG', "periodoEntrega", periodoEntrega);
							    		        	var entregaPeriodoActual = fc == periodoEntrega;
							    		        	
											        //-- Para que no cree lineas cada ves
								    		        if(aplicadaJDG == '') {
								    		        	
														for(cont=0;cont<cantVenta;cont++) {
															var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
											        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',salesRep);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id', jdgId);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',recordId);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',returnBlank(series_tm[cont]));
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_total', compesacionUni);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_bono', preBonoDetalle);
												        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_monto_entrega', preEntregaDetalle);
												        	nlapiSubmitRecord(RecComisionesDetJdG, true, true);
														}
								    		        }  else if(entregaPeriodoActual){
							    		        		//-- Buscar el detalle para este pedido
							    		        		var fiilterDetails = [['custrecord_jdg_det_comision_jdg_id','is',jdgId], 'and', 
							    		        				['custrecord_jdg_det_factura','is', recordId], 'and', ['custrecord_jdg_det_venta_realizada_por','is', salesRep], 'and', 
							    		        				['custrecord_jdg_det_cliente','is', entity]];
							    		        		var srchDetail = nlapiSearchRecord('customrecord_comisiones_jdg_det', null, fiilterDetails, new nlobjSearchColumn('custrecord_jdg_det_monto_entrega'));
							    		        		if(srchDetail && Number(srchDetail[0].getValue('custrecord_jdg_det_monto_entrega')) == 0){
							    		        			nlapiLogExecution( 'DEBUG', "Actualiza montoEntrega JDG :  " + srchDetail[0].getId(), 'montoEntrega: ' + preEntregaDetalle );
							    		        			nlapiSubmitField('customrecord_comisiones_jdg_det', srchDetail[0].getId(), 'custrecord_jdg_det_monto_entrega', preEntregaDetalle);
							    		        			nlapiSubmitField(recordType,recordId,'custbody_comp_jdg_entrega', jdgId);
							    		        		} else {
							    		        			nlapiLogExecution( 'DEBUG', " -> NO SE Actualiza montoEntrega JDG :  " + srchDetail[0].getId(), 'montoEntrega: ' + Number(srchDetail[0].getValue('custrecord_jdg_det_monto_entrega')));
							    		        		}
							    		        	} else if(fechaEntregaObj) {
							    		        		var idCompEntrega = manageCompensacionJDG(salesRep, salesRepText, cuentaBancaria, nombreUnidad,cantVenta, periodoEntrega, recordConfCompId,
							    		        				fieldNameEntrega, true, type, configuracionPrincipal, acumulaPuntos, recordId, entity);
							    		        		nlapiLogExecution( 'DEBUG', "idCompEntrega ", idCompEntrega );
							    		        		if(idCompEntrega){
							    		        			nlapiSubmitField(recordType,recordId,'custbody_comp_jdg_entrega', idCompEntrega); 
							    		        		}
							    		        		
							    		        		//-- Calculo de enterga para el registro H de enrega
							    		        		//-- Calculo de la cantidad de entregas									     			
										     			var cols = new nlobjSearchColumn('formulanumeric',null,'sum').setFormula('CASE WHEN {custrecord_jdg_det_monto_entrega} > 0 THEN 1 ELSE 0 END');
										     			var filtersEntr = [new nlobjSearchFilter('custrecord_jdg_det_comision_jdg_id', null, 'is',  idCompEntrega),
										     			   new nlobjSearchFilter('custrecord_jdg_fecha_comision', 'custrecord_jdg_det_comision_jdg_id', 'is',periodoEntrega)]
										     			var _compensacionesEntrega = nlapiSearchRecord('customrecord_comisiones_jdg_det', null, filtersEntr, cols);
										     			var cantidadEntregas = _compensacionesEntrega?Number(_compensacionesEntrega[0].getValue(cols)):0;
										     			nlapiLogExecution( 'DEBUG', "cantidadEntregas", cantidadEntregas );
										     			
										     			//-- Calculo del monto de entregas
										     			var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
										     			var filtersEVP  = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  (entregaPeriodoActual&&(type == 'copy' ||type == 'create')?1:0) + cantidadEntregas),
		    									  			   new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
										     			var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsMentonEnt);
										     			nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
										     			if(_compensaciones_so_evpre){
										     				var montoTotalEntrega = Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt));
										     				nlapiLogExecution( 'DEBUG', "montoTotalEntrega", montoTotalEntrega );
											     			nlapiSubmitField('customrecord_comisiones_jdg', idCompEntrega,['custrecord_jdg_entrega_propio', 'vcustrecord_jdg_nro_entregas_propios'],[montoTotalEntrega,cantidadEntregas]); 
										     			}
							    		        	}									     			
								            	}
						        			}
							        			
							            	if(jdgId != 0)  { 
							            		//Guarda el enlace de la comision en la sales order
												if(!isSaved){
													nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
													isSaved = true;
												}
							            		nlapiSubmitField(recordType,recordId,'custbody_comision_aplicada_jdg', jdgId); 
							            	}
								            	
								            //-- Valida agrupaciones princial y acumula
							            	actualizaAcumuladoJDG(configuracionPrincipal, acumulaPuntos, salesRep, salesRepText, fc);
//							        		}
								        };break;
								        
							        	case 1: //Presentadora
							        	{
//							        		if(aplicadaPRE == '') {
							        			var RecComisionesPre = null;
							        			filtersResCom[0] 	= new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep);
								            	filtersResCom[1] 	= new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc);
								            	filtersResCom[2] 	= new nlobjSearchFilter('custrecord10', null, 'is', recordConfCompId);
								            	
								            	columnsResCom[0] 	= new nlobjSearchColumn('custrecord_pre_no_ventas');
								     			columnsResCom[1] 	= new nlobjSearchColumn('custrecord_pre_fecha_comision');
								     			
							        			if(aplica_esquema_especial == true && _no_venta_especial < _cdc_ventas_maximas_esp) {
							        				nlapiLogExecution( 'DEBUG', "Presentadora", "A" );
									     			columnsResCom[2] 	= new nlobjSearchColumn('custrecord_pre_no_ventas_esp_periodo');
									     			columnsResCom[3] 	= new nlobjSearchColumn('custrecord_pre_no_ventas_esp_acumulado');
									     			columnsResCom[4] 	= new nlobjSearchColumn('custrecord_pre_compensacion');
									     			columnsResCom[5] 	= new nlobjSearchColumn('custrecord_pre_entrega');
									     			resultsResCom = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filtersResCom, columnsResCom));
									     	        
									     			var filtersEVE  = [new nlobjSearchFilter('custrecord_esq_ventas_esp_conf_comp', null, 'is', recordConfCompId)];
									     			var comPREUn = 0;
									     			if(resultsResCom=='') {
									     				nlapiLogExecution( 'DEBUG', "Presentadora", "A.1" );
									     	        	var _pre_no_ventas_esp_acumulado_GLOBAL	= 0;
									        			var filtersEVE_acumulado =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep), 
									        									   new nlobjSearchFilter('custrecord10', null, 'is', recordConfCompId)];
							        					var _compensaciones_so_evpre_acumulado 	= returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', 'customsearch_comp_so_eve_acumu_pre', filtersEVE_acumulado, null));
							        					
							        					if(_compensaciones_so_evpre_acumulado != '') {
							        						_pre_no_ventas_esp_acumulado_GLOBAL	= returnNumber(_compensaciones_so_evpre_acumulado[0].getValue('custrecord_pre_no_ventas_esp_acumulado'));	
							        					}
							        					
									        			var desde = _pre_no_ventas_esp_acumulado_GLOBAL;
									        			var hasta = cantVenta + _pre_no_ventas_esp_acumulado_GLOBAL; 
								    														        			
									        			filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', hasta));
								    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'greaterthanorequalto', desde));
								    					
							        					var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_esp', 'customsearch_compensaciones_so_eve', filtersEVE, null));
							        					var _esq_ventas_esp_compensacion = returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_esp_compensacion',null,'SUM'));
										        		
							        					RecComisionesPre = nlapiCreateRecord('customrecord_comisiones_pre');										            	
										        		RecComisionesPre.setFieldValue('custrecord_pre_empleado',salesRep);
										        		RecComisionesPre.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
										        		RecComisionesPre.setFieldValue('custrecord_pre_cuenta_bancaria',cuentaBancaria);
										        		RecComisionesPre.setFieldValue('custrecord_pre_nombre_unidad',nombreUnidad);
										        		RecComisionesPre.setFieldValue('custrecord_pre_no_ventas', 0);
										        		RecComisionesPre.setFieldValue('custrecord_pre_compensacion',0);
										        		RecComisionesPre.setFieldValue('custrecord_pre_entrega',0);
										        		RecComisionesPre.setFieldValue('custrecord_pre_x_maquina',0);
										        		RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',_esq_ventas_esp_compensacion);
										        		RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_periodo',cantVenta);
										        		RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_acumulado',hasta);
										        		RecComisionesPre.setFieldValue('custrecord_pre_compensacion_especial',_esq_ventas_esp_compensacion);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_fecha_comision',fc);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_bono_manual',0.0);
//									     				var newRecComisionesPreId = nlapiSubmitRecord(newRecComisionesPre, true, true);
									     				nlapiSubmitField('employee', salesRep, 'custentity_no_venta_especial', hasta);
									     				comPREUn = 0;
									     	        } else { 
									     	        	nlapiLogExecution( 'DEBUG', "Presentadora", "A.2" );
										     			var _pre_no_ventas_esp_periodo 		= returnNumber(resultsResCom[0].getValue('custrecord_pre_no_ventas_esp_periodo'));
										     			var _pre_no_ventas_esp_acumulado 	= returnNumber(resultsResCom[0].getValue('custrecord_pre_no_ventas_esp_acumulado'));
										     			var _pre_compensacion				= returnNumber(resultsResCom[0].getValue('custrecord_pre_compensacion'));
										     			var _pre_entrega					= returnNumber(resultsResCom[0].getValue('custrecord_pre_entrega'));
										     			var esquema_ventas_presentadora		= _pre_compensacion + _pre_entrega; 
									        			var desde							= 0;
									        			var hasta							= 0;
							        					var _compensaciones_so_evpre 		= new Object();
							        					var _esq_ventas_esp_compensacion 	= 0;
							        					
							        					if(_pre_no_ventas_esp_acumulado == _pre_no_ventas_esp_periodo) {
									    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', (_pre_no_ventas_esp_acumulado + cantVenta)));
										        		} else {
										        			var filtersEVE_acumulado = [new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep),
										        										new nlobjSearchFilter('custrecord10', null, 'is', recordConfCompId)];
								        					var _compensaciones_so_evpre_acumulado = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', 'customsearch_comp_so_eve_acumu_pre', filtersEVE_acumulado, null));
										        			desde = returnNumber(_compensaciones_so_evpre_acumulado[0].getValue('custrecord_pre_no_ventas_esp_acumulado'));
										        			hasta = (_pre_no_ventas_esp_acumulado + cantVenta);
									    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'lessthanorequalto', hasta));
									    					filtersEVE.push(new nlobjSearchFilter('custrecord_esq_ventas_esp_no_venta', null, 'greaterthanorequalto', desde));
										        		}
							        					
							        					_compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_esp', 'customsearch_compensaciones_so_eve', filtersEVE, null));
							        					_esq_ventas_esp_compensacion = returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_esp_compensacion',null,'SUM'));
							        					
//									            		var RecComisionesPre 		= nlapiLoadRecord('customrecord_comisiones_pre',resultsResCom[0].getId());
							        					RecComisionesPre = nlapiLoadRecord('customrecord_comisiones_pre',resultsResCom[0].getId());
							        					
							        					var totalComActual = RecComisionesPre.getFieldValue('custrecord_pre_compensacion');
							        					comPREUn = 0 - totalComActual;
							        					
								            			RecComisionesPre.setFieldValue('custrecord_pre_no_ventas',0);
								            			RecComisionesPre.setFieldValue('custrecord_pre_compensacion',0);
								            			RecComisionesPre.setFieldValue('custrecord_pre_entrega',0);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_x_maquina',0);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',_esq_ventas_esp_compensacion + esquema_ventas_presentadora);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_periodo',(_pre_no_ventas_esp_periodo + cantVenta));
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_acumulado',(_pre_no_ventas_esp_acumulado + cantVenta));
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_compensacion_especial',_esq_ventas_esp_compensacion);
//									    		        var RecComisionesPreId = nlapiSubmitRecord(RecComisionesPre, true, true);
									    		        nlapiSubmitField('employee', salesRep, 'custentity_no_venta_especial', (_pre_no_ventas_esp_acumulado + cantVenta));
									     	        }
									     			
									     			RecComisionesPre.setFieldValue('custrecord10', recordConfCompId);
								     				preId = nlapiSubmitRecord(RecComisionesPre, true, true);
								     								
								     				//-- Calculo de comiciones individales por detalle
								     				for(cont=0;cont<cantVenta;cont++) {
									    	        	var RecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_pre_det');
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_comision_pre_id', preId);
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_empleado_id',salesRep);
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_factura',recordId);
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_serie_tm',returnBlank(series_tm[cont]));
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_venta_realizada_por',salesRep);
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_cliente',entity);
								     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_esquema_venta_especia','T');
								     		        	RecComisionesDetPre.setFieldValue('custrecord42', commPREUn);
								    		        	nlapiSubmitRecord(RecComisionesDetPre, true, true);
													}
							        			} else { 
							        				nlapiLogExecution( 'DEBUG', "Presentadora", "B" );
									     			columnsResCom[2] 	= new nlobjSearchColumn('custrecord_pre_compensacion_especial');
									     			resultsResCom 		= returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filtersResCom, columnsResCom));
									     	       
									     			var _esq_ventas_pre_compensacion 	= 0;
									        		var _esq_ventas_pre_total 			= 0;
									        		var _esq_ventas_pre_x_maquina 		= 0;
									        		var _esqVentasPreComisionBase = 0;
									        											        					
									        		//-- Calculo de monto de entrega detalle
									        		nlapiLogExecution( 'DEBUG', "Calculo de montoEntrega ", "Calculo de montoEntrega " );
							    		        	var montoEntrega = 0;
							    		        	var montoBono = 0;
							    		        	var periodoEntrega = fechaEntregaObj ? ("0"+(fechaEntregaObj.getMonth()+1)).slice(-2) + "/" +fechaEntregaObj.getFullYear(): null;
							    		        	nlapiLogExecution( 'DEBUG', "periodoEntrega", periodoEntrega);
							    		        	var entregaPeriodoActual = fc == periodoEntrega;
							    		        	if(entregaPeriodoActual){
							    		        		var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
							    		        		var columnsMontoBono = new nlobjSearchColumn('custrecord_esq_ventas_pre_bono');
							    		        		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId),
							    		        			new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1)];
							    		        		nlapiLogExecution( 'DEBUG', "filtersEVP", filtersEVP );
							        					var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, [columnsMentonEnt, columnsMontoBono]);
							        					nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
							        					montoEntrega = _compensaciones_so_evpre? Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt)):0;
							        					montoBono = _compensaciones_so_evpre? Number(_compensaciones_so_evpre[0].getValue(columnsMontoBono)):0;
							    		        	} 
							    		        	
							    		        	var comPREUn = 0;
							    		        	var montoBonoAnterior = 0;
									     			if(resultsResCom=='') {
									     				nlapiLogExecution( 'DEBUG', "Presentadora", "B.1" );
								    					var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', cantVenta),
								    									  new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
							        					var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersEVP));
							        					
							        					if(_compensaciones_so_evpre != '') {
								        					_esq_ventas_pre_compensacion 	= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_compensacion'));
											        		_esq_ventas_pre_total 			= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_total'));
											        		_esq_ventas_pre_x_maquina 		= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_x_maquina'));
											        		_esqVentasPreComisionBase = Number(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_bono'));
							        					}
							        												        					
							        					RecComisionesPre = nlapiCreateRecord('customrecord_comisiones_pre');										        		 
							        					RecComisionesPre.setFieldValue('custrecord_pre_empleado',salesRep);
							        					RecComisionesPre.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_cuenta_bancaria',cuentaBancaria);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_nombre_unidad',nombreUnidad);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas', cantVenta);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',_esq_ventas_pre_total);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_periodo',0);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_acumulado',0);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_compensacion_especial',0);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_fecha_comision',fc);
								     	               	RecComisionesPre.setFieldValue('custrecord_pre_bono_manual',0.0);
								     	               comPREUn = _esq_ventas_pre_compensacion;
									     	        } else {
									     	        	nlapiLogExecution( 'DEBUG', "Presentadora", "B.2" );
										     			//---------------------------------------------
											        	//-- Calcula la cantidad de ventas
							        					var columnCountVenta = new nlobjSearchColumn('custrecord_pre_det_factura', null, 'count');
							        					var filterCountVentaPropio = [	['custrecord_pre_det_comision_pre_id','is', resultsResCom[0].getId()], 'and', 
							        												['custrecord_pre_det_venta_realizada_por','anyof',salesRep], 'and',
							        												['custrecord_pre_det_factura','noneof', nlapiGetRecordId()]];
	        					
							        					var searchCantEntega = nlapiSearchRecord('customrecord_comisiones_pre_det',null, filterCountVentaPropio, columnCountVenta);
							        					var _pre_no_ventas = Number(searchCantEntega[0].getValue(columnCountVenta)) + 1;
							        					nlapiLogExecution( 'DEBUG', "_pre_no_ventas", _pre_no_ventas );
										     			/*var _pre_no_ventas 	= returnNumber(resultsResCom[0].getValue('custrecord_pre_no_ventas'));
										     			
										     			if(type == 'create' || type == 'copy') {
										     				_pre_no_ventas += cantVenta;
										     			}*/
										     			
										     			var _pre_compensacion_especial 		= returnNumber(resultsResCom[0].getValue('custrecord_pre_compensacion_especial'));
								    					var filtersEVP  = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  _pre_no_ventas),
					    									  			   new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
							        					var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersEVP));
							        					
							        					if(_compensaciones_so_evpre != '') {
							        						_esq_ventas_pre_compensacion 	= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_compensacion'));
//											        		_esq_ventas_pre_entrega 		= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_entrega',null,null));
											        		_esq_ventas_pre_total 			= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_total'));
											        		_esq_ventas_pre_x_maquina 		= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_x_maquina'));
											        		_esqVentasPreComisionBase = Number(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_bono'));
							        					}
										     			
									            		RecComisionesPre = nlapiLoadRecord('customrecord_comisiones_pre',resultsResCom[0].getId());
									            		montoBonoAnterior = RecComisionesPre.getFieldValue('custrecord_pre_h_bono');
									            		var totalComActual = RecComisionesPre.getFieldValue('custrecord_pre_compensacion');
							        					comPREUn =_esq_ventas_pre_compensacion - totalComActual;
							        					
							        					nlapiLogExecution( 'DEBUG', "_pre_no_ventas", _pre_no_ventas );
								            			RecComisionesPre.setFieldValue('custrecord_pre_no_ventas',_pre_no_ventas);
								     				   	RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',_esq_ventas_pre_total + _pre_compensacion_especial);
									     	        }	
									     			nlapiLogExecution( 'DEBUG', "_esqVentasPreComisionBase", _esqVentasPreComisionBase );
									     			nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_compensacion", _esq_ventas_pre_compensacion );
//									     			_esq_ventas_pre_compensacion += _esqVentasPreComisionBase;
//									     			comPREUn += _esqVentasPreComisionBase;
									     			
								     				RecComisionesPre.setFieldValue('custrecord_pre_compensacion',_esq_ventas_pre_compensacion);
								     				RecComisionesPre.setFieldValue('custrecord_pre_x_maquina',_esq_ventas_pre_x_maquina);
								     				RecComisionesPre.setFieldValue('custrecord10', recordConfCompId );
								     				preId = nlapiSubmitRecord(RecComisionesPre, true, true);	
								     				nlapiLogExecution( 'DEBUG', "preId", preId );
								     				//-- Calculo de comiciones individales por detalle
							        		
								     				var calcMontoBono = null;
							    		        	if(!aplicadaPRE) {
									     				for(var cont=0;cont<cantVenta;cont++) {
										    	        	var RecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_pre_det');
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_comision_pre_id', preId);
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_empleado_id',salesRep);
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_factura',recordId);
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_serie_tm',returnBlank(series_tm[cont]));
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_venta_realizada_por',salesRep);
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_cliente',entity);
									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_esquema_venta_especia','F');
									     		        	RecComisionesDetPre.setFieldValue('custrecord42',comPREUn);
									     		        	RecComisionesDetPre.setFieldValue('custrecord47', montoEntrega);
//									     		        	RecComisionesDetPre.setFieldValue('custrecord_pre_bono', montoBono);
									     		        	calcMontoBono = nlapiSubmitRecord(RecComisionesDetPre, true, true);
									    		        	nlapiLogExecution( 'DEBUG', "calcMontoBono ", calcMontoBono );
														}
							    		        	} else if(entregaPeriodoActual){
							    		        		//-- Buscar el detalle para este pedido
							    		        		var fiilterDetails = [['custrecord_pre_det_comision_pre_id','is',preId], 'and', 
							    		        				['custrecord_pre_det_factura','is', recordId], 'and', ['custrecord_pre_det_empleado_id','is', salesRep], 'and', 
							    		        				['custrecord_pre_det_cliente','is', entity]];
							    		        		var srchDetail = nlapiSearchRecord('customrecord_comisiones_pre_det', null, fiilterDetails);
							    		        		if(srchDetail){
							    		        			nlapiLogExecution( 'DEBUG', "Actualiza montoEntrega:  " + srchDetail[0].getId(), 'montoEntrega: ' + montoEntrega  + ' xmontoBono: ');
							    		        			nlapiSubmitField('customrecord_comisiones_pre_det', srchDetail[0].getId(),['custrecord47'], [montoEntrega]);
							    		        		}
							    		        	} else if(fechaEntregaObj) {
							    		        		var idCompEntrega = manageCompensacion(salesRep, salesRepText, cuentaBancaria, nombreUnidad,cantVenta, periodoEntrega, recordConfCompId,
							    		        				fieldNameEntrega, true, type, configuracionPrincipal, acumulaPuntos, recordId, entity, returnBlank(series_tm[cont]));
							    		        		nlapiLogExecution( 'DEBUG', "idCompEntrega ", idCompEntrega );
							    		        		if(idCompEntrega){
							    		        			nlapiSubmitField(recordType,recordId,'custbody80',idCompEntrega); 
							    		        		}
							    		        		
							    		        		//-- Calculo de enterga para el registro H de enrega
							    		        		//-- Calculo de la cantidad de entregas									     			
										     			var cols = [new nlobjSearchColumn('formulanumeric',null,'sum').setFormula('CASE WHEN {custrecord47} > 0 THEN 1 ELSE 0 END'),
										     						new nlobjSearchColumn('formulanumeric',null,'sum').setFormula('CASE WHEN {custrecord42} > 0 THEN 1 ELSE 1 END')];
										     			var filtersEntr = [new nlobjSearchFilter('custrecord_pre_det_comision_pre_id', null, 'is',  idCompEntrega),
										     			   new nlobjSearchFilter('custrecord_pre_fecha_comision', 'custrecord_pre_det_comision_pre_id', 'is',periodoEntrega)]
										     			var _compensacionesEntrega = nlapiSearchRecord('customrecord_comisiones_pre_det', null, filtersEntr, cols);
										     			var cantidadEntregas = _compensacionesEntrega?Number(_compensacionesEntrega[0].getValue(cols[0])):0;
										     			var cantidadVentas = _compensacionesEntrega?Number(_compensacionesEntrega[0].getValue(cols[1])):0;
										     			nlapiLogExecution( 'DEBUG', "cantidadVentas", cantidadVentas );
										     			nlapiLogExecution( 'DEBUG', "cantidadEntregas", cantidadEntregas );
										     			
										     			//-- Calculo del monto de entregas
										     			var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
										     			var columnsMontoBono = new nlobjSearchColumn('custrecord_esq_ventas_pre_bono');
										     			var filtersEVP  = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  (entregaPeriodoActual&&type == 'create'?1:0) + cantidadEntregas),
		    									  			   new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
										     			var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, [columnsMentonEnt, columnsMontoBono]);
										     			nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
										     			if(_compensaciones_so_evpre){
										     				var montoTotalEntrega = Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt));
										     				var montoBono = Number(_compensaciones_so_evpre[0].getValue(columnsMontoBono));
										     				nlapiLogExecution( 'DEBUG', "montoTotalEntrega", montoTotalEntrega );
											     			nlapiSubmitField('customrecord_comisiones_pre', idCompEntrega,['custrecord_pre_entrega', 'custrecord37','custrecord_pre_no_ventas', 'custrecord_pre_h_bono'],[montoTotalEntrega,cantidadEntregas, cantidadVentas, montoBono]); 
										     			}
							    		        	}
							    		        	
							    		        	//-- Calculo de la cantidad de entregas									     			
									     			var cols = [new nlobjSearchColumn('formulanumeric',null,'sum').setFormula('CASE WHEN {custrecord47} > 0 THEN 1 ELSE 0 END'),
									     						new nlobjSearchColumn('formulanumeric',null,'sum').setFormula('CASE WHEN {custrecord42} > 0 THEN 1 ELSE 1 END')];
									     			var filtersEntr = [new nlobjSearchFilter('custrecord_pre_det_comision_pre_id', null, 'is',  preId),
									     			   new nlobjSearchFilter('custrecord_pre_fecha_comision', 'custrecord_pre_det_comision_pre_id', 'is',fc)]
									     			var _compensacionesEntrega = nlapiSearchRecord('customrecord_comisiones_pre_det', null, filtersEntr, cols);
									     			var cantidadEntregas = _compensacionesEntrega?Number(_compensacionesEntrega[0].getValue(cols[0])):0;
									     			var cantidadVentas = _compensacionesEntrega?Number(_compensacionesEntrega[0].getValue(cols[1])):0;
									     			nlapiLogExecution( 'DEBUG', "cantidadVentas", cantidadVentas );
									     			nlapiLogExecution( 'DEBUG', "cantidadEntregas", cantidadEntregas );
									     			
									     			//-- Calculo del monto de entregas
									     			var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
									     			var columnsMontoBono = new nlobjSearchColumn('custrecord_esq_ventas_pre_bono');
									     			var filtersEVP  = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', cantidadEntregas),// (entregaPeriodoActual&&type == 'create'?1:0) + cantidadEntregas),
	    									  			   new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
									     			var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsMentonEnt);
									     			
									     			
									     			//-- Calculo de bono por ventas
									     			var columnsMontoBono = new nlobjSearchColumn('custrecord_esq_ventas_pre_bono');
									     			var filtersEVP  = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', cantidadVentas),
	    									  			   new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
									     			var _compensaciones_so_evpreBono = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsMontoBono);
									     			nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
									     			
									     			if(_compensaciones_so_evpre){
									     				var montoTotalEntrega = Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt));
									     				var montoBono = _compensaciones_so_evpreBono ? Number(_compensaciones_so_evpreBono[0].getValue(columnsMontoBono)) : 0;
									     				nlapiLogExecution( 'DEBUG', "montoBono: " + montoBono +   "montoTotalEntrega", montoTotalEntrega );
									     				nlapiSubmitField('customrecord_comisiones_pre', preId,['custrecord_pre_entrega', 'custrecord37','custrecord_pre_no_ventas', 'custrecord_pre_h_bono'],[montoTotalEntrega,cantidadEntregas, cantidadVentas, montoBono]); 
										     			
										     			if(calcMontoBono){
										     				var diferenciaBono = montoBono - montoBonoAnterior;
										     				nlapiLogExecution( 'DEBUG', "diferenciaBono", diferenciaBono );
										     				nlapiSubmitField('customrecord_comisiones_pre_det', calcMontoBono,['custrecord_pre_bono'],[diferenciaBono]); 											     			
										     			}
										     			
									     			}
							        			}
							        			
								            	if(preId != 0) { 
								            		var fieldNames = ['custbody_comision_aplicada_pre'];
								            		var fieldValues = [preId];
								            		//Guarda el enlace de la comision en la sales order
													if(!isSaved){
//														nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
														fieldNames.push('custbody79');
														fieldValues.push(recordConfCompId);
														isSaved = true;
													}
													
													if(entregaPeriodoActual){
														fieldNames.push('custbody80');
														fieldValues.push(preId);
													}
													
								            		nlapiSubmitField(recordType, recordId, fieldNames, fieldValues); 
								            	}
								            	
								            	//-- Valida agrupaciones princial y acumula
										        if(configuracionPrincipal && !acumulaPuntos){
										        	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
										        	var filters =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep), 
										        				  new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc),
										        				  new nlobjSearchFilter('custrecord10', null, 'is', configuracionPrincipal.id)];
										        	
													var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_pre', null, filters);
													var objAcumulador = null;
													if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
														objAcumulador = nlapiLoadRecord('customrecord_comisiones_pre', rsltAcumuladorPrincipal[0].id);
													} else {
														objAcumulador = nlapiCreateRecord('customrecord_comisiones_pre');
														objAcumulador.setFieldValue('custrecord_pre_empleado',salesRep);
														objAcumulador.setFieldValue('custrecord10', configuracionPrincipal.id);
														objAcumulador.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
														objAcumulador.setFieldValue('custrecord_pre_fecha_comision',fc);
													}
													
													//- Busca el total de comisiones generadas													
													var filters =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', salesRep), 
								        				  new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc),
								        				  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord10', 'is', 'F')];
													
													if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
														filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
													}
								        	
													var columns = [new nlobjSearchColumn('custrecord_pre_total_comisiones', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_bono_manual', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_no_ventas', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_compensacion', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_entrega', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_x_maquina', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_no_ventas_esp_periodo', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_no_ventas_esp_acumulado', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_compensacion_especial', null, 'sum'),
																   new nlobjSearchColumn('custrecord_pre_h_bono', null, 'sum')];
													
													var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_pre', null, filters, columns);	
													objAcumulador.setFieldValue('custrecord_pre_total_comisiones', rsltComisionGroup[0].getValue(columns[0]));
													objAcumulador.setFieldValue('custrecord_pre_bono_manual', rsltComisionGroup[0].getValue(columns[1]));
													objAcumulador.setFieldValue('custrecord_pre_no_ventas', rsltComisionGroup[0].getValue(columns[2]));
													objAcumulador.setFieldValue('custrecord_pre_compensacion', rsltComisionGroup[0].getValue(columns[3]));
													objAcumulador.setFieldValue('custrecord_pre_entrega', rsltComisionGroup[0].getValue(columns[4]));
													objAcumulador.setFieldValue('custrecord_pre_x_maquina', rsltComisionGroup[0].getValue(columns[5]));
													objAcumulador.setFieldValue('custrecord_pre_no_ventas_esp_periodo', rsltComisionGroup[0].getValue(columns[6]));
													objAcumulador.setFieldValue('custrecord_pre_no_ventas_esp_acumulado', rsltComisionGroup[0].getValue(columns[7]));
													objAcumulador.setFieldValue('custrecord_pre_compensacion_especial', rsltComisionGroup[0].getValue(columns[8]));
													objAcumulador.setFieldValue('custrecord_pre_h_bono', rsltComisionGroup[0].getValue(columns[9]));
													nlapiSubmitRecord(objAcumulador, true, true);
										        }
//								            }
							            };break;
							        }
								};
								
								if(supervisor!='' && aplicadaJDG_Super=='') {
						        	filtersResComSup[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', supervisor);
						        	filtersResComSup[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
						        	
						        	//-- custrecord10 -> Cï¿½digo de Configuraciï¿½n de comisiones
						        	filtersResComSup[2] 	= new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId);
						        	
									columnsResComSup[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
									columnsResComSup[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
									columnsResComSup[2] = new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
									resultsResComSup = nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResComSup, columnsResComSup);
									
									var filter = new nlobjSearchFilter('custrecord_esq_ventas_jdg_conf_comp', null, 'is', recordConfCompId);
									var _compensaciones_so_evj = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_jdg', 'customsearch_compensaciones_so_evj', filter));
									var lines = _compensaciones_so_evj.length;
									var jdg_total_comisiones_equipo = 0;
									var compJDGUn = 0;
									
									var RecComisionesJdG = null; 
									var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
									var columnsEVP = new nlobjSearchColumn(fieldNameEntrega);
									var _esq_ventas_pre_entrega = 0;
									var _jdg_no_entregas = 0;
					        		var preEntregaDetalle = 0;
									
									if(!resultsResComSup) {
										//--calculo de monto de entrega
//							        	filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', (fechaEntrega?cantVenta:0));
//			        					var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP));
//			        					
//			        					if(_compensaciones_so_evpre != '') {
//			        						var EVP = _compensaciones_so_evpre[0];
//							        		_esq_ventas_pre_entrega = returnNumber(EVP.getValue(columnsEVP));
//			        					}
										
										for(var i=0;i<lines;i++) {
											var _esq_ventas_jdg_no_ventas_de 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_de'));
											var _esq_ventas_jdg_no_ventas_a 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_a'));
											var _esq_ventas_jdg_compensacion 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_compensacion'));
																						
				    						if(_esq_ventas_jdg_no_ventas_de <= cantVenta  && cantVenta <= _esq_ventas_jdg_no_ventas_a) {
				    							jdg_total_comisiones_equipo = _esq_ventas_jdg_compensacion;
				    							break;
				    						}
										}
							        	RecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
							        	
							        	RecComisionesJdG.setFieldValue('custrecord_jdg_empleado',supervisor);
							        	RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',supervisorText);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_propio',0);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio',0);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',0);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_x_maquina_propio',0);
						        		RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',cantVenta);
                                        RecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);
                                        RecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
                                        compJDGUn = 0;
//                                        preEntregaDetalle = fechaEntregaObj? _esq_ventas_pre_entrega : 0;
//									    _esq_ventas_pre_entrega = fechaEntregaObj? 1 : 0;
							        } else {
				    		        	var no_ventas_equipo = returnNumber(resultsResComSup[0].getValue('custrecord_jdg_no_ventas_equipo'));
				    		        	no_ventas_equipo  += cantVenta;
										
										for(var i=0;i<lines;i++) {
											var _esq_ventas_jdg_no_ventas_de 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_de'));
											var _esq_ventas_jdg_no_ventas_a 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_a'));
											var _esq_ventas_jdg_compensacion 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_compensacion'));
				    						
											if(_esq_ventas_jdg_no_ventas_de <= no_ventas_equipo && no_ventas_equipo <= _esq_ventas_jdg_no_ventas_a) {
				    							jdg_total_comisiones_equipo = _esq_ventas_jdg_compensacion;
				    							break;
				    						}
										}
										
						        		RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResComSup[0].getId());
						        		
						        		//---------------------------------------------
			        					///-- Calculo de entrega						        		
//			        					if(fechaEntrega){
//			        						var columnCountEntrega = new nlobjSearchColumn('custrecord_jdg_det_factura', null, 'count');
//				        					var filterCountEntrega = [	['custrecord_jdg_det_comision_jdg_id','is', resultsResComSup[0].getId()], 'and', 
//				        												['custrecord_jdg_det_factura.custbody_fcha_entrega_tm5_cliente','isnotempty',''], 'and', 
//				        					                            //['custrecord_jdg_det_factura.custbody_jerarquia','is','3'], 'and', 
//				        					                            ['custrecord_jdg_det_factura.mainline','is','T']];
//				        					
//				        					if(fechaEntrega){
//				        						filterCountEntrega.push('and');
//				        						filterCountEntrega.push(['custrecord_jdg_det_factura','noneof', nlapiGetRecordId()]);
//				        					}
//				        					
//				        					searchCantEntega = nlapiSearchRecord('customrecord_comisiones_jdg_det',null, filterCountEntrega , columnCountEntrega);
//				        					_jdg_no_entregas = Number(searchCantEntega[0].getValue(columnCountEntrega)) + 1;
//				        					filtersEVP[1] = new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto',  _jdg_no_entregas );
//				        					
//				        					var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsEVP);
//				        					
//				        					if(_compensaciones_so_evpre) {					
//				        						var EVP = _compensaciones_so_evpre[0];
//								        		_esq_ventas_pre_entrega = returnNumber(EVP.getValue(columnsEVP));
//				        					}
//				        					nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", '_esq_ventas_pre_entrega  A: ' +  Number(searchCantEntega[0].getValue(columnCountEntrega)) );
//			        					} else {
//			        						_jdg_no_entregas = RecComisionesJdG.getFieldValue('custrecord_jdg_nro_entregas_propios');
//			        						_esq_ventas_pre_entrega = RecComisionesJdG.getFieldValue('custrecord_jdg_entrega_propio');
//			        					}
			        					//------------------------------------------------			        					
//			        					nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", '_esq_ventas_pre_entrega: ' + _esq_ventas_pre_entrega  + ' _jdg_no_entregas: ' + _jdg_no_entregas );
			        					
			        					//-- Monto de entrega por detalle
//						        		var montoEntregaAnterior =  RecComisionesJdG.getFieldValue('custrecord_jdg_entrega_propio');
//						        		preEntregaDetalle = fechaEntregaObj ? _esq_ventas_pre_entrega - montoEntregaAnterior : 0;
//						        		nlapiLogExecution( 'DEBUG', "preEntregaDetalle ", preEntregaDetalle);
						        		
						        		var totalComActual = RecComisionesJdG.getFieldValue('custrecord_jdg_total_comisiones_equipo');
						        		compJDGUn = jdg_total_comisiones_equipo - totalComActual;
						        			
							            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
							        }
															        
									
									if(RecComisionesJdG){
										RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
										RecComisionesJdG.setFieldValue('custrecord9', recordConfCompId);
										RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio', _esq_ventas_pre_entrega);
				        				RecComisionesJdG.setFieldValue('custrecord_jdg_nro_entregas_propios', _jdg_no_entregas);
										var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG, true, true);
										
										//-- Para que no cree lineas cada ves
					    		        if(aplicadaJDG_Super == '') {
					    		        	
											for(cont=0;cont<cantVenta;cont++) {
												for(cont=0;cont<cantVenta;cont++) {
							    		        	var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
						    		        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',supervisor);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',RecComisionesJdGId);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',recordId);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',returnBlank(series_tm[cont]));
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_total',compJDGUn);
						    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_monto_entrega', preEntregaDetalle);
							    			        nlapiSubmitRecord(RecComisionesDetJdG, true, true);
												}
											}
					    		        }  /*else if(entregaPeriodoActual){
				    		        		//-- Buscar el detalle para este pedido
				    		        		var fiilterDetails = [['custrecord_jdg_det_comision_jdg_id','is',RecComisionesJdGId], 'and', 
				    		        				['custrecord_jdg_det_factura','is', recordId], 'and', ['custrecord_jdg_det_venta_realizada_por','is', supervisor], 'and', 
				    		        				['custrecord_jdg_det_cliente','is', entity]];
				    		        		var srchDetail = nlapiSearchRecord('customrecord_comisiones_jdg_det', null, fiilterDetails, new nlobjSearchColumn('custrecord_jdg_det_monto_entrega'));
				    		        		if(srchDetail && Number(srchDetail[0].getValue('custrecord_jdg_det_monto_entrega')) == 0){
				    		        			nlapiLogExecution( 'DEBUG', "Actualiza montoEntrega JDG :  " + srchDetail[0].getId(), 'montoEntrega: ' + preEntregaDetalle );
				    		        			nlapiSubmitField('customrecord_comisiones_jdg_det', srchDetail[0].getId(), 'custrecord_jdg_det_monto_entrega', preEntregaDetalle);
				    		        			nlapiSubmitField(recordType,recordId,'custbody_comp_jdg_entrega', jdgId);
				    		        		} else {
				    		        			nlapiLogExecution( 'DEBUG', " -> NO SE Actualiza montoEntrega JDG :  " + srchDetail[0].getId(), 'montoEntrega: ' + Number(srchDetail[0].getValue('custrecord_jdg_det_monto_entrega')));
				    		        		}
				    		        	}*/
					    		        
										
										//Guarda el enlace de la comision en la sales order
										if(!isSaved){
											nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
											isSaved = true;
										}
										
										nlapiSubmitField(recordType,recordId,'custbody_comision_aplicada_jdg_super', RecComisionesJdGId); 
									}									
									
									//-- Valida agrupaciones princial y acumula
									actualizaAcumuladoJDG(configuracionPrincipal, acumulaPuntos, supervisor, supervisorText, fc);
								}
								
							  	if(jdgSplit!='' && aplicadaJDG_Split=='') {
						       		if(ffs!='' && fis!='') {
										var fisMS 		= fis.getTime();
										var ffsMS 		= ffs.getTime();
										
										if(factFecMS >= fisMS && factFecMS <= ffsMS) {
						    		        filtersResComSplit[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', jdgSplit);
						    	        	filtersResComSplit[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc);
						    	        	
						    	        	//-- custrecord10 -> Cï¿½digo de Configuraciï¿½n de comisiones
						    	        	filtersResComSplit[2] 	= new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId);
								        	
						    				columnsResComSplit[0] = new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo');
						    				columnsResComSplit[1] = new nlobjSearchColumn('custrecord_jdg_fecha_comision');
						    				columnsResComSplit[2] = new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo');
						    				resultsResComSplit    = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResComSplit, columnsResComSplit));
						    				nlapiLogExecution( 'debug', imain + ' 9 resultsResComSplit', JSON.stringify(resultsResComSplit));
						    				
						    				var RecComisionesJdG = null;
						    				var filter = new nlobjSearchFilter('custrecord_esq_ventas_jdg_conf_comp', null, 'is', recordConfCompId);
						    				var _compensaciones_so_evj = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_jdg', 'customsearch_compensaciones_so_evj', filter));
											var lines = _compensaciones_so_evj.length;
											var jdg_total_comisiones_equipo = 0;
											var montoJDG = 0;
											
						    				if(resultsResComSplit == '')  {
												for(var i=0;i<lines;i++) {
													var _esq_ventas_jdg_no_ventas_de 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_de'));
													var _esq_ventas_jdg_no_ventas_a 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_a'));
													var _esq_ventas_jdg_compensacion 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_compensacion'));
													
//													if(_esq_ventas_jdg_no_ventas_de <= 1  && 1 <= _esq_ventas_jdg_no_ventas_a) {
//														montoJDG = _esq_ventas_jdg_compensacion;
//						    						}
													
						    						if(_esq_ventas_jdg_no_ventas_de <= cantVenta  && cantVenta <= _esq_ventas_jdg_no_ventas_a) {
						    							jdg_total_comisiones_equipo = _esq_ventas_jdg_compensacion;
						    							break;
						    						}
												}
//									        	var newRecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
												RecComisionesJdG = nlapiCreateRecord('customrecord_comisiones_jdg');
									        	//-- custrecord10 -> Cï¿½digo de Configuraciï¿½n de comisiones
												RecComisionesJdG.setFieldValue('custrecord9', recordConfCompId);
							    	        	
												RecComisionesJdG.setFieldValue('custrecord_jdg_empleado',supervisor);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_empleado',supervisorText);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_propio',0);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_compensacion_propio',0);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_entrega_propio',0);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_propio',0);
								        		RecComisionesJdG.setFieldValue('custrecord_jdg_x_maquina_propio',0);
											    RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',cantVenta);
											    RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
											    RecComisionesJdG.setFieldValue('custrecord_jdg_fecha_comision',fc);											    
											    RecComisionesJdG.setFieldValue('custrecord_jdg_bono_manual',0.0);
											    montoJDG = jdg_total_comisiones_equipo;
						    		        } else {
						    		        	var no_ventas_equipo = returnNumber(resultsResComSplit[0].getValue('custrecord_jdg_no_ventas_equipo'));
						    		        	no_ventas_equipo += cantVenta;
												
												for(var i=0;i<lines;i++) {
													var _esq_ventas_jdg_no_ventas_de 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_de'));
													var _esq_ventas_jdg_no_ventas_a 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_no_ventas_a'));
													var _esq_ventas_jdg_compensacion 	= returnNumber(_compensaciones_so_evj[i].getValue('custrecord_esq_ventas_jdg_compensacion'));
						    						
//													if(_esq_ventas_jdg_no_ventas_de <= 1  && 1 <= _esq_ventas_jdg_no_ventas_a) {
//														montoJDG = _esq_ventas_jdg_compensacion;
//						    						}
//													
													if(_esq_ventas_jdg_no_ventas_de <= no_ventas_equipo && no_ventas_equipo <= _esq_ventas_jdg_no_ventas_a) {
						    							jdg_total_comisiones_equipo = _esq_ventas_jdg_compensacion;
						    							break;
						    						}
												}
												
								        		var RecComisionesJdG = nlapiLoadRecord('customrecord_comisiones_jdg',resultsResComSplit[0].getId());
								        		
								        		var totalComActual = RecComisionesJdG.getFieldValue('custrecord_jdg_no_ventas_equipo');
								        		montoJDG = jdg_total_comisiones_equipo - totalComActual;
								        		
									            RecComisionesJdG.setFieldValue('custrecord_jdg_no_ventas_equipo',no_ventas_equipo);
									            RecComisionesJdG.setFieldValue('custrecord_jdg_total_comisiones_equipo',jdg_total_comisiones_equipo);
									            	
						    		        }
						    				
						    				var RecComisionesJdGId = nlapiSubmitRecord(RecComisionesJdG, true, true);
					    			        
					    					for(cont=0;cont<cantVenta;cont++) {
						    		        	var RecComisionesDetJdG = nlapiCreateRecord('customrecord_comisiones_jdg_det');
					    		        		RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_empleado_id',jdgSplit);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_comision_jdg_id',RecComisionesJdGId);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_factura',recordId);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_serie_tm',returnBlank(series_tm[cont]));
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_venta_realizada_por',salesRep);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_cliente',entity);
					    			        	RecComisionesDetJdG.setFieldValue('custrecord_jdg_det_total',montoJDG);
						    			        nlapiSubmitRecord(RecComisionesDetJdG, true, true);
					    					}
					    					
					    					nlapiSubmitField(recordType,recordId,'custbody_comision_aplicada_jdg_split', RecComisionesJdGId);
					    					
					    					//Guarda el enlace de la comision en la sales order
											if(!isSaved){
												nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
												isSaved = true;
											}
								        }
										
										//-- Valida agrupaciones princial y acumula
										actualizaAcumuladoJDG(configuracionPrincipal, acumulaPuntos, supervisor, supervisorText, fc);
									}
								}
							  	nlapiLogExecution( 'DEBUG', "aplica_esquema_especial ", 'aplica_esquema_especial: ' + aplica_esquema_especial );
								if(reclu!='' && aplicadaREC=='' && _generar_comp_reclutamiento == 'T' && aplica_esquema_especial == false)  {
							        if(fechaReact != '')  { 
							        	fechaAlta 		= fechaReact;
						        	}
							        
									var ventasTotalesREC 		= 0;
									var cantVentaPeriodo 		= 0;
									var desdePeriodo	 		= 0;
									var _rec_total_comisiones	= 0;
					        		
									if(fechaAlta!='') { 
										var fechaAltaMS 	= returnNumber(fechaAlta.getTime());
//										var fc_complete  	= fechaAlta.getDate()+ '/' +fcNonZero;
											fc_complete 	= nlapiStringToDate(fc_complete);	
										var fc_completeMS	= returnNumber(fc_complete.setDate(fechaAlta.getDate()));//returnNumber(fc_complete.getTime());
										
										while(fc_completeMS>=fechaAltaMS) {
											var fcAux = (returnNumber(fc_complete.getMonth()) + 1) + '/' + fc_complete.getFullYear();
												fcAux = fcAux.split('/');
											if(returnNumber(fcAux[0])<10) { fcAux[0] = '0'+fcAux[0];}
											fcAux = fcAux.join('/');
											var	filtersResComAux = new Array();
												filtersResComAux[0] = new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep);
									        	filtersResComAux[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fcAux);
									        	
									        	//-- custrecord10 -> Cï¿½digo de Configuraciï¿½n de comisiones
									        	filtersResComAux[2] 	= new nlobjSearchFilter('custrecord11', null, 'is', recordConfCompId);
							    	        	
											var columnsResComAux = new Array();
												columnsResComAux[0] = new nlobjSearchColumn('custrecord_rec_no_ventas_totales');
												columnsResComAux[1] = new nlobjSearchColumn('custrecord_rec_no_ventas_periodo');
												columnsResComAux[2] = new nlobjSearchColumn('custrecord_rec_desde_periodo');
												columnsResComAux[3] = new nlobjSearchColumn('custrecord_rec_total_comisiones');
											var resultsResComAux = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComAux, columnsResComAux));
											
											if(resultsResComAux!='') {
												cantVentaPeriodo = returnNumber(resultsResComAux[0].getValue('custrecord_rec_no_ventas_periodo'));
												ventasTotalesREC = returnNumber(resultsResComAux[0].getValue('custrecord_rec_no_ventas_totales'));
												desdePeriodo	 = returnNumber(resultsResComAux[0].getValue('custrecord_rec_desde_periodo'));
												//importeAcumulado = (returnNumber(resultsResComAux[0].getValue('custrecord_rec_total_comisiones')));
												break;
											}
											fc_complete 	= nlapiAddMonths(fc_complete,(-1));
											fc_completeMS	= returnNumber(fc_complete.getTime());
										}
									}
									
					                filtersResComRec[0]=  new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep);
					                filtersResComRec[1] = new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc);
					             
					                //-- custrecord10 -> Cï¿½digo de Configuraciï¿½n de comisiones
					                filtersResComRec[2] 	= new nlobjSearchFilter('custrecord11', null, 'is', recordConfCompId);
						        	
									columnsResComRec[0] = new nlobjSearchColumn('custrecord_rec_no_ventas_totales');
									columnsResComRec[1] = new nlobjSearchColumn('custrecord_rec_no_ventas_periodo');
									columnsResComRec[2] = new nlobjSearchColumn('custrecord_rec_desde_periodo');
									columnsResComRec[3] = new nlobjSearchColumn('custrecord_rec_fecha_comision');
									resultsResComRec = returnBlank(nlapiSearchRecord('customrecord_comisiones_rec', null, filtersResComRec, columnsResComRec));
									
									if(resultsResComRec == '')  {
					        			var desde = cantVenta + ventasTotalesREC;
					        			var hasta = desde + cantVenta;;
				    					var filtersEVREC = [new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'lessthan', hasta),
				    										new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'greaterthanorequalto', desde),
				    										new nlobjSearchFilter('custrecord_esq_ventas_rec_conf_comp', null, 'is', recordConfCompId)];
										var _compensaciones_so_evr 	= returnBlank(nlapiSearchRecord('customrecord_esq_ventas_rec', 'customsearch_compensaciones_so_evr', filtersEVREC, null));
						        		_rec_total_comisiones 	= returnNumber(_compensaciones_so_evr[0].getValue('custrecord_esq_ventas_rec_compensacion',null,'SUM'));						        			
							        	
						        		var comUn = 0;
						        		var RecComisionesRec = null;
						        		if(ventasTotalesREC < _cdc_ventas_maximas_rec) { 
//								        	var newRecComisionesRec = nlapiCreateRecord('customrecord_comisiones_rec');
						        			RecComisionesRec = nlapiCreateRecord('customrecord_comisiones_rec');
						        			RecComisionesRec.setFieldValue('custrecord_rec_empleado',salesRep);
						        			RecComisionesRec.setFieldValue('custrecord_rec_nombre_empleado',salesRepText);
						        			RecComisionesRec.setFieldValue('custrecord_rec_reclutadora',reclu);
						        			RecComisionesRec.setFieldValue('custrecord_rec_categoria_empleado',recluCatEmp);
						        			RecComisionesRec.setFieldValue('custrecord_rec_esquema_reclutadora',recluEsqEmp);
						        			RecComisionesRec.setFieldValue('custrecord_rec_cuenta_bancaria',cuentaBancaria);
							                RecComisionesRec.setFieldValue('custrecord_rec_nombre_unidad',nombreUnidad);
							                RecComisionesRec.setFieldValue('custrecord_rec_nombre_unidad_reclutadora',recluNomUniEmp);
							                RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_totales',cantVenta+ventasTotalesREC);
							                RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_periodo',cantVenta);
										    RecComisionesRec.setFieldValue('custrecord_rec_desde_periodo',cantVenta+ventasTotalesREC);
										    RecComisionesRec.setFieldValue('custrecord_rec_total_comisiones',_rec_total_comisiones);
										    RecComisionesRec.setFieldValue('custrecord_rec_fecha_comision',fc);
										    RecComisionesRec.setFieldValue('custrecord_rec_bono_manual',0.0);
										    comUn = _rec_total_comisiones;
										}
							        } else {
							        	var filtersEVREC =[new nlobjSearchFilter('custrecord_esq_ventas_rec_conf_comp', null, 'is', recordConfCompId)];
						        		if(ventasTotalesREC == cantVentaPeriodo) {
					    					filtersEVREC.push(new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'lessthanorequalto', (cantVenta+ventasTotalesREC)));
						        		} else {
						        			var desde = desdePeriodo;
						        			var hasta = cantVenta + ventasTotalesREC;
				    						filtersEVREC.push(new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'lessthanorequalto', hasta));
				    						filtersEVREC.push(new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'greaterthanorequalto', desde));																		        			
						        		}
						        		
						        		var _compensaciones_so_evr = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_rec', 'customsearch_compensaciones_so_evr', filtersEVREC, null));
						        		_rec_total_comisiones = returnNumber(_compensaciones_so_evr[0].getValue('custrecord_esq_ventas_rec_compensacion',null,'SUM'));	
						        		
							        	if(ventasTotalesREC < _cdc_ventas_maximas_rec) {
							        		RecComisionesRec = nlapiLoadRecord('customrecord_comisiones_rec',resultsResComRec[0].getId());
							        		
							        		var totalComActual = RecComisionesRec.getFieldValue('custrecord_rec_total_comisiones');
							        		comUn = _rec_total_comisiones - totalComActual;
							        			
						        			RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_totales',returnNumber(ventasTotalesREC)+returnNumber(cantVenta));
						        			RecComisionesRec.setFieldValue('custrecord_rec_no_ventas_periodo',returnNumber(cantVenta)+returnNumber(cantVentaPeriodo));
						        			RecComisionesRec.setFieldValue('custrecord_rec_total_comisiones',_rec_total_comisiones);
								       	}
									}
									
//									if(recId !=0 ){ 
									if(RecComisionesRec){
										RecComisionesRec.setFieldValue('custrecord11', recordConfCompId);
										var RecComisionesRecId = nlapiSubmitRecord(RecComisionesRec, true, true);	
										
										///- Calculo de comision individual por detalle
//										var filtersComUn = [new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'lessthanorequalto', 1),
//				    										new nlobjSearchFilter('custrecord_esq_ventas_rec_no_venta', null, 'greaterthanorequalto', 1),
//				    										new nlobjSearchFilter('custrecord_esq_ventas_rec_conf_comp', null, 'is', recordConfCompId)];
//										var _compensacionesComun = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_rec', 'customsearch_compensaciones_so_evr', filtersComUn));
//						        		var comUn = returnNumber(_compensacionesComun[0].getValue('custrecord_esq_ventas_rec_compensacion',null,'SUM'));						        			
			        	
		        		
										for(cont=0;cont<cantVenta;cont++){
								        	var RecComisionesDetRec = nlapiCreateRecord('customrecord_comisiones_rec_det');
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_empleado_id',reclu);
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_comision_rec_id',RecComisionesRecId);
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_factura',recordId);
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_serie_tm',returnBlank(series_tm[cont]));
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_venta_realizada_por',salesRep);
								        	RecComisionesDetRec.setFieldValue('custrecord_rec_det_cliente',entity);
								        	RecComisionesDetRec.setFieldValue('custrecord43',comUn);
								        	nlapiSubmitRecord(RecComisionesDetRec, true, true);
							       		}
										nlapiSubmitField(recordType,recordId,'custbody_comision_aplicada_rec', RecComisionesRecId); 
										
										//Guarda el enlace de la comision en la sales order
										if(!isSaved){
											nlapiSubmitField('salesorder', nlapiGetRecordId(), 'custbody79',recordConfCompId);
											isSaved = true;
										}
									}
									
									//-- Valida agrupaciones princial y acumula
							        nlapiLogExecution( 'DEBUG', "configuracionPrincipal ", JSON.stringify(configuracionPrincipal) );
							        nlapiLogExecution( 'DEBUG', "acumulaPuntos ", acumulaPuntos );
							        if(configuracionPrincipal && !acumulaPuntos){
							        	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
							        	var filters =[new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep), 
							        				  new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc),
							        				  new nlobjSearchFilter('custrecord11', null, 'is', configuracionPrincipal.id)];
							        	
										var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_rec', null, filters);
										var objAcumulador = null;
										nlapiLogExecution( 'DEBUG', "rsltAcumuladorPrincipal ", JSON.stringify(rsltAcumuladorPrincipal) );
										if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
											objAcumulador = nlapiLoadRecord('customrecord_comisiones_rec', rsltAcumuladorPrincipal[0].id);
										} else {
											objAcumulador = nlapiCreateRecord('customrecord_comisiones_rec');
											objAcumulador.setFieldValue('custrecord_rec_empleado',salesRep);
											objAcumulador.setFieldValue('custrecord11', configuracionPrincipal.id);
											objAcumulador.setFieldValue('custrecord_rec_nombre_empleado',salesRepText);
											objAcumulador.setFieldValue('custrecord_rec_fecha_comision',fc);
                                          	
										}
                                      
                                      	objAcumulador.setFieldValue('custrecord_rec_reclutadora',reclu);
										objAcumulador.setFieldValue('custrecord_rec_categoria_empleado',recluCatEmp);
										objAcumulador.setFieldValue('custrecord_rec_esquema_reclutadora',recluEsqEmp);
						                
										//- Busca el total de comisiones generadas
										
										var filters =[new nlobjSearchFilter('custrecord_rec_empleado', null, 'is', salesRep), 
					        				  new nlobjSearchFilter('custrecord_rec_fecha_comision', null, 'is', fc),
					        				  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord11', 'is', 'F')];
										
										if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
											filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
										}
					        	
										var columns = [new nlobjSearchColumn('custrecord_rec_no_ventas_totales', null, 'sum'),
													   new nlobjSearchColumn('custrecord_rec_no_ventas_periodo', null, 'sum'),
													   new nlobjSearchColumn('custrecord_rec_desde_periodo', null, 'sum'),
													   new nlobjSearchColumn('custrecord_rec_total_comisiones', null, 'sum'),
													   new nlobjSearchColumn('custrecord_rec_bono_manual', null, 'sum')];
										
										var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_rec', null, filters, columns);											
										nlapiLogExecution( 'DEBUG', "rsltComisionGroup ", rsltComisionGroup );
										objAcumulador.setFieldValue('custrecord_rec_no_ventas_totales', rsltComisionGroup[0].getValue(columns[0]));
										objAcumulador.setFieldValue('custrecord_rec_no_ventas_periodo', rsltComisionGroup[0].getValue(columns[1]));
										objAcumulador.setFieldValue('custrecord_rec_desde_periodo', rsltComisionGroup[0].getValue(columns[2]));
										objAcumulador.setFieldValue('custrecord_rec_total_comisiones', rsltComisionGroup[0].getValue(columns[3]));
										objAcumulador.setFieldValue('custrecord_rec_bono_manual', rsltComisionGroup[0].getValue(columns[4]));
										nlapiSubmitRecord(objAcumulador, true, true);
										nlapiLogExecution( 'DEBUG', "objAcumulador ", JSON.stringify(objAcumulador) );
							        }
								}
						    }
						}
					}
			    }
			}
		}
	} catch(e) {
		var companyConfig		= nlapiLoadConfiguration('companyinformation');
		var companyname			= returnBlank(companyConfig.getFieldValue('companyname'));
		var context				= nlapiGetContext();		
	  	var company				= returnBlank(context.getCompany());
	  	var deploymentId		= returnBlank(context.getDeploymentId());
	  	var environment			= returnBlank(context.getEnvironment());
	  	var executionContext	= returnBlank(context.getExecutionContext());
	  	var logLevel			= returnBlank(context.getLogLevel());
	  	var name				= returnBlank(context.getName());
	  	var role				= returnBlank(context.getRole());
	  	var roleCenter			= returnBlank(context.getRoleCenter());
	  	var roleId				= returnBlank(context.getRoleId());
	  	var scriptId			= returnBlank(context.getScriptId());
	  	var user				= returnBlank(context.getUser());
	  	var author				= 20003;
	  	var recipient			= 'gonzalo.rodriguez@imr.com.mx';
	  	var subject				= '';
	  	var body 				= '';
		body 			   += '<table>';
		body 			   += '<tr><td><b>' + 'Company ID' 			+ '</b></td><td>&nbsp;</td><td>' + company 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Company' 			+ '</b></td><td>&nbsp;</td><td>' + companyname		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Record Type' 		+ '</b></td><td>&nbsp;</td><td>' + recordType 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Record ID' 			+ '</b></td><td>&nbsp;</td><td>' + recordId 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Script ID' 			+ '</b></td><td>&nbsp;</td><td>' + scriptId 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Deployment ID' 		+ '</b></td><td>&nbsp;</td><td>' + deploymentId 	+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Log Level' 			+ '</b></td><td>&nbsp;</td><td>' + logLevel 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Environment' 		+ '</b></td><td>&nbsp;</td><td>' + environment 		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Execution Context' 	+ '</b></td><td>&nbsp;</td><td>' + executionContext + '</td></tr>';
		body 			   += '<tr><td><b>' + 'User' 				+ '</b></td><td>&nbsp;</td><td>' + user 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Name' 				+ '</b></td><td>&nbsp;</td><td>' + name 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role' 				+ '</b></td><td>&nbsp;</td><td>' + role 			+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role Center' 		+ '</b></td><td>&nbsp;</td><td>' + roleCenter		+ '</td></tr>';
		body 			   += '<tr><td><b>' + 'Role ID' 			+ '</b></td><td>&nbsp;</td><td>' + roleId 			+ '</td></tr>';
		body 			   += '</table>';
  		body 			   += '<br>';
  		body 			   += '<br>';
  		
  		if( e instanceof nlobjError )	{
	  		var ecode 		 = returnBlank(e.getCode());
			var edetails 	 = returnBlank(e.getDetails());
			var eid 		 = returnBlank(e.getId());
			var einternalid	 = returnBlank(e.getInternalId());
			var estacktrace	 = returnBlank(e.getStackTrace());
			if(estacktrace != '')
			{
				estacktrace	 = estacktrace.join();
			}
			var euserevent 	 = returnBlank(e.getUserEvent());
			nlapiLogExecution( 'ERROR', 'ecode',ecode);
			nlapiLogExecution( 'ERROR', 'edetails',edetails);
			nlapiLogExecution( 'ERROR', 'eid',eid);
			nlapiLogExecution( 'ERROR', 'einternalid',einternalid);
			nlapiLogExecution( 'ERROR', 'estacktrace',estacktrace);
			nlapiLogExecution( 'ERROR', 'euserevent',euserevent);
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Error Code' 			+ '</b></td><td>&nbsp;</td><td>' + ecode 		+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Details' 		+ '</b></td><td>&nbsp;</td><td>' + edetails 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error ID' 			+ '</b></td><td>&nbsp;</td><td>' + eid 			+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error Internal ID'	+ '</b></td><td>&nbsp;</td><td>' + einternalid 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error StackTrace' 	+ '</b></td><td>&nbsp;</td><td>' + estacktrace 	+ '</td></tr>';
				body 			   += '<tr><td><b>' + 'Error UserEvent' 	+ '</b></td><td>&nbsp;</td><td>' + euserevent 	+ '</td></tr>';
			body 			   += '</table>';
	  		subject  = 'e instanceof nlobjError';
		} else {
	    	var errorString	 = e.toString();
	    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
  			body 			   += '<table>';
				body 			   += '<tr><td><b>' + 'Unexpected Error' 	+ '</b></td><td>&nbsp;</td><td>' + errorString 		+ '</td></tr>';
			body 			   += '</table>';
	    	subject  = 'unexpected error';
        }
        nlapiSendEmail(author, recipient, subject, body, null, null, null, null);
  	}
}



function esArticuloPermitido(articulo,articulosPermitidos) {
	for(var j=0;j<articulosPermitidos.length;j++) {
		var articulo_permitido = articulosPermitidos[j]; 
		if(articulo == articulo_permitido) {
			return true;
			break;
		}
	}
}							
function esTipoDeVentaPermitido(tipoVenta,tipoVentaPermitidos) {
	for(var j=0;j<tipoVentaPermitidos.length;j++) {
		var tipoVentaPermitido = tipoVentaPermitidos[j]; 
		if(tipoVenta == tipoVentaPermitido) {
			return true;
			break;
		}
	}
}

//-- Crea o actualiza registro H de comision y detalle. Crea o actualiza el acumulador del periodo.
function manageCompensacion(emplId, salesRepText, cuentaBancaria, nombreUnidad,cantVenta, fc, recordConfCompId,
		fieldNameEntrega, isEntrega, type, configuracionPrincipal, acumulaPuntos, recordId, entity, serie_tm){
	nlapiLogExecution( 'DEBUG', "manageCompensacion parameters", 'emplId: ' + emplId + 'fc: ' + fc + 'recordConfCompId: ' + recordConfCompId);
	var RecComisionesPre = null;
	var filtersResCom = [new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', emplId)
					, new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc)
					, new nlobjSearchFilter('custrecord10', null, 'is', recordConfCompId)];
	
	var columnsResCom = [new nlobjSearchColumn('custrecord_pre_no_ventas')
					, new nlobjSearchColumn('custrecord_pre_fecha_comision')
					, new nlobjSearchColumn('custrecord_pre_compensacion_especial')];
			
	var resultsResCom = nlapiSearchRecord('customrecord_comisiones_pre', null, filtersResCom, columnsResCom);
   				
	//-- Calculo de monto de entrega detalle
	nlapiLogExecution( 'DEBUG', "Calculo de montoEntrega ", "Calculo de montoEntrega " );
	var montoEntrega = 0;
	var montoBono = 0;
	if(isEntrega){
		var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
		var columnsMontoBono = new nlobjSearchColumn('custrecord_esq_ventas_pre_bono');
		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId),
			new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1)];
		nlapiLogExecution( 'DEBUG', "filtersEVP", filtersEVP );
		var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, [columnsMentonEnt, columnsMontoBono]);
		nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
		montoEntrega = _compensaciones_so_evpre? Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt)):0;
	} 
	nlapiLogExecution( 'DEBUG', "montoEntrega ", _esq_ventas_pre_entrega );
	
	var _esq_ventas_pre_compensacion = 0;
	var _esq_ventas_pre_entrega = 0;
	var _esq_ventas_pre_total 	= 0;
	var _esq_ventas_pre_x_maquina = 0;
//	var _esqVentasPreComisionBase = 0;	
	
	if(!resultsResCom) {
		nlapiLogExecution( 'DEBUG', "manageCompensacion", "B.1" );
		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', cantVenta),
						  new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
		var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersEVP));
		
		if(_compensaciones_so_evpre != '') {
    		_esq_ventas_pre_total 			= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_total'));
    		_esq_ventas_pre_x_maquina 		= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_x_maquina'));
//    		_esqVentasPreComisionBase = Number(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_bono'));
		}
		
		//-- Calculo de monto de entrega detalle
		nlapiLogExecution( 'DEBUG', "Calculo de montoEntrega ", montoEntrega);
    	if(isEntrega){
    		_esq_ventas_pre_entrega = montoEntrega;
    	}
    	nlapiLogExecution( 'DEBUG', "montoEntrega ", _esq_ventas_pre_entrega );
    	//----------------
		
		RecComisionesPre = nlapiCreateRecord('customrecord_comisiones_pre');										        		 
		RecComisionesPre.setFieldValue('custrecord_pre_empleado',emplId);
		RecComisionesPre.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
       	RecComisionesPre.setFieldValue('custrecord_pre_cuenta_bancaria',cuentaBancaria);
       	RecComisionesPre.setFieldValue('custrecord_pre_nombre_unidad',nombreUnidad);
       	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas', 0);
       	RecComisionesPre.setFieldValue('custrecord_pre_total_comisiones',_esq_ventas_pre_total);
       	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_periodo',0);
       	RecComisionesPre.setFieldValue('custrecord_pre_no_ventas_esp_acumulado',0);
       	RecComisionesPre.setFieldValue('custrecord_pre_compensacion_especial',0);
       	RecComisionesPre.setFieldValue('custrecord_pre_fecha_comision',fc);
       	RecComisionesPre.setFieldValue('custrecord_pre_bono_manual',0.0);
       	preId = nlapiSubmitRecord(RecComisionesPre, true, true);	
    } else {
    	preId = resultsResCom[0].getId();	
    }
	
	
	
	//-- Calculo de comiciones individales por detalle
	var filtersPREComUn = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1),
	  					new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
	var _compensacionesPREun = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersPREComUn));
	var commBase = Number(_compensacionesPREun[0].getValue('custrecord_esq_ventas_pre_bono'));
	var comPREUn = Number(_compensacionesPREun[0].getValue('custrecord_esq_ventas_pre_compensacion')) + commBase;

		
	nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", _esq_ventas_pre_entrega );
	
	//-- Buscar el detalle para este pedido
	var fiilterDetails = [['custrecord_pre_det_comision_pre_id','is',preId], 'and', 
			['custrecord_pre_det_factura','is', recordId], 'and', ['custrecord_pre_det_empleado_id','is', emplId], 'and', 
			['custrecord_pre_det_cliente','is', entity]];
	var srchDetail = nlapiSearchRecord('customrecord_comisiones_pre_det', null, fiilterDetails);
	if(srchDetail){
		nlapiLogExecution( 'DEBUG', "Actualiza montoEntrega:  " + srchDetail[0].getId(), montoEntrega );
		nlapiSubmitField('customrecord_comisiones_pre_det', srchDetail[0].getId(), ['custrecord47'], [montoEntrega]);
	} else {
		for(cont=0;cont<cantVenta;cont++) {
        	var RecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_pre_det');
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_comision_pre_id', preId);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_empleado_id',emplId);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_factura',recordId);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_serie_tm', serie_tm);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_venta_realizada_por',emplId);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_cliente',entity);
        	RecComisionesDetPre.setFieldValue('custrecord_pre_det_esquema_venta_especia','F');
        	RecComisionesDetPre.setFieldValue('custrecord42',0);
        	RecComisionesDetPre.setFieldValue('custrecord47', montoEntrega);
        	nlapiSubmitRecord(RecComisionesDetPre, true, true);
		}
	}		    	
    
	//-- Valida agrupaciones princial y acumula
    if(configuracionPrincipal && !acumulaPuntos){
    	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
    	var filters =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', emplId), 
    				  new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc),
    				  new nlobjSearchFilter('custrecord10', null, 'is', configuracionPrincipal.id)];
    	
		var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_pre', null, filters);
		var objAcumulador = null;
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			objAcumulador = nlapiLoadRecord('customrecord_comisiones_pre', rsltAcumuladorPrincipal[0].id);
		} else {
			objAcumulador = nlapiCreateRecord('customrecord_comisiones_pre');
			objAcumulador.setFieldValue('custrecord_pre_empleado',emplId);
			objAcumulador.setFieldValue('custrecord10', configuracionPrincipal.id);
			objAcumulador.setFieldValue('custrecord_pre_nombre_empleado',salesRepText);
			objAcumulador.setFieldValue('custrecord_pre_fecha_comision',fc);
		}
		
		//- Busca el total de comisiones generadas													
		var filters =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', emplId), 
			  new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc),
			  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord10', 'is', 'F')];
		
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
		}

		var columns = [new nlobjSearchColumn('custrecord37', null, 'sum'),
					   new nlobjSearchColumn('custrecord_pre_entrega', null, 'sum'),
					   new nlobjSearchColumn('custrecord_pre_h_bono', null, 'sum')];
		
		var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_pre', null, filters, columns);	
		objAcumulador.setFieldValue('custrecord37', rsltComisionGroup[0].getValue(columns[0]));
		objAcumulador.setFieldValue('custrecord_pre_entrega', rsltComisionGroup[0].getValue(columns[1]));
		objAcumulador.setFieldValue('custrecord_pre_h_bono', rsltComisionGroup[0].getValue(columns[2]));
		nlapiSubmitRecord(objAcumulador, true, true);
    }
    return preId;
}


//-- Crea o actualiza registro H de comision y detalle. Crea o actualiza el acumulador del periodo.
function manageCompensacionJDG(emplId, salesRepText, cuentaBancaria, nombreUnidad,cantVenta, fc, recordConfCompId,
		fieldNameEntrega, isEntrega, type, configuracionPrincipal, acumulaPuntos, recordId, entity, serie_tm){
	nlapiLogExecution( 'DEBUG', "manageCompensacionJDG parameters", 'emplId: ' + emplId + 'fc: ' + fc + 'recordConfCompId: ' + recordConfCompId);
	var RecComisionesPre = null;
	var filtersResCom = [new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', emplId)
					, new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc)
					, new nlobjSearchFilter('custrecord9', null, 'is', recordConfCompId)];
	
	var resultsResCom = nlapiSearchRecord('customrecord_comisiones_jdg', null, filtersResCom);
   				
	//-- Calculo de monto de entrega detalle
	nlapiLogExecution( 'DEBUG', "Calculo de montoEntrega ", "Calculo de montoEntrega " );
	var montoEntrega = 0;
	if(isEntrega){
		var columnsMentonEnt = new nlobjSearchColumn(fieldNameEntrega);
		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId),
			new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1)];
		nlapiLogExecution( 'DEBUG', "filtersEVP", filtersEVP );
		var _compensaciones_so_evpre = nlapiSearchRecord('customrecord_esq_ventas_pre', null, filtersEVP, columnsMentonEnt);
		nlapiLogExecution( 'DEBUG', "_compensaciones_so_evpre", _compensaciones_so_evpre );
		montoEntrega = _compensaciones_so_evpre? Number(_compensaciones_so_evpre[0].getValue(columnsMentonEnt)):0;
	} 
	
	var _esq_ventas_pre_compensacion = 0;
	var _esq_ventas_pre_entrega = 0;
	var _esq_ventas_pre_total 	= 0;
	var _esq_ventas_pre_x_maquina = 0;
	
	if(!resultsResCom) {
		nlapiLogExecution( 'DEBUG', "manageCompensacionJDG", "B.1" );
		var filtersEVP = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', cantVenta),
						  new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
		var _compensaciones_so_evpre = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersEVP));
		
		if(_compensaciones_so_evpre != '') {
    		_esq_ventas_pre_total 			= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_total'));
    		_esq_ventas_pre_x_maquina 		= returnNumber(_compensaciones_so_evpre[0].getValue('custrecord_esq_ventas_pre_x_maquina'));
		}
		
		//-- Calculo de monto de entrega detalle
		nlapiLogExecution( 'DEBUG', "Calculo de montoEntrega ", montoEntrega);
    	if(isEntrega){
    		_esq_ventas_pre_entrega = montoEntrega;
    	}
    	nlapiLogExecution( 'DEBUG', "montoEntrega ", _esq_ventas_pre_entrega );
    	//----------------
		
		RecComisionesPre = nlapiCreateRecord('customrecord_comisiones_jdg');										        		 
		RecComisionesPre.setFieldValue('custrecord_jdg_empleado',emplId);
		RecComisionesPre.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
       	RecComisionesPre.setFieldValue('custrecord_jdg_cuenta_bancaria',cuentaBancaria);
       	RecComisionesPre.setFieldValue('custrecord_jdg_nombre_unidad',nombreUnidad);
       	RecComisionesPre.setFieldValue('custrecord_jdg_no_ventas_propio', 0);
       	RecComisionesPre.setFieldValue('custrecord_jdg_entrega_propio',_esq_ventas_pre_entrega);
       	RecComisionesPre.setFieldValue('custrecord_jdg_fecha_comision',fc);
       	preId = nlapiSubmitRecord(RecComisionesPre, true, true);	
    } else {
    	preId = resultsResCom[0].getId();	
    }
	
	
	
	//-- Calculo de comiciones individales por detalle
	var filtersPREComUn = [new nlobjSearchFilter('custrecord_esq_ventas_pre_no_ventas', null, 'equalto', 1),
	  					new nlobjSearchFilter('custrecord_esq_ventas_pre_conf_comp', null, 'is', recordConfCompId)];
	var _compensacionesPREun = returnBlank(nlapiSearchRecord('customrecord_esq_ventas_pre', 'customsearch_compensaciones_so_evp', filtersPREComUn));
	var commBase = Number(_compensacionesPREun[0].getValue('custrecord_esq_ventas_pre_bono'));
	var comPREUn = Number(_compensacionesPREun[0].getValue('custrecord_esq_ventas_pre_compensacion')) + commBase;

		
	nlapiLogExecution( 'DEBUG', "_esq_ventas_pre_entrega ", _esq_ventas_pre_entrega );
	
	//-- Buscar el detalle para este pedido
	var fiilterDetails = [['custrecord_jdg_det_comision_jdg_id','is',preId], 'and', 
			['custrecord_jdg_det_factura','is', recordId], 'and', ['custrecord_jdg_det_venta_realizada_por','is', emplId], 'and', 
			['custrecord_jdg_det_cliente','is', entity]];
	var srchDetail = nlapiSearchRecord('customrecord_comisiones_jdg_det', null, fiilterDetails);
	if(srchDetail){
		nlapiLogExecution( 'DEBUG', "Actualiza montoEntrega:  " + srchDetail[0].getId(), montoEntrega );
		nlapiSubmitField('customrecord_comisiones_jdg_det', srchDetail[0].getId(), ['custrecord_jdg_det_monto_entrega'], [montoEntrega]);
	} else {
		for(cont=0;cont<cantVenta;cont++) {
        	var RecComisionesDetPre = nlapiCreateRecord('customrecord_comisiones_jdg_det');
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_comision_jdg_id', preId);
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_venta_realizada_por',emplId);
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_factura',recordId);
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_cliente',entity);
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_esquema_venta_especia','F');
        	RecComisionesDetPre.setFieldValue('custrecord_jdg_det_monto_entrega', montoEntrega);
        	nlapiSubmitRecord(RecComisionesDetPre, true, true);
		}
	}		    	
    
	//-- Valida agrupaciones princial y acumula
    if(configuracionPrincipal && !acumulaPuntos){
    	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
    	var filters =[new nlobjSearchFilter('custrecord_pre_empleado', null, 'is', emplId), 
    				  new nlobjSearchFilter('custrecord_pre_fecha_comision', null, 'is', fc),
    				  new nlobjSearchFilter('custrecord10', null, 'is', configuracionPrincipal.id)];
    	
		var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_jdg', null, filters);
		var objAcumulador = null;
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			objAcumulador = nlapiLoadRecord('customrecord_comisiones_jdg', rsltAcumuladorPrincipal[0].id);
		} else {
			objAcumulador = nlapiCreateRecord('customrecord_comisiones_jdg');
			objAcumulador.setFieldValue('custrecord_jdg_empleado',emplId);
			objAcumulador.setFieldValue('custrecord9', configuracionPrincipal.id);
			objAcumulador.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
			objAcumulador.setFieldValue('custrecord_jdg_fecha_comision',fc);
		}
		
		//- Busca el total de comisiones generadas													
		var filters =[new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', emplId), 
			  new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc),
			  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord9', 'is', 'F')];
		
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
		}

		var columns = [new nlobjSearchColumn('custrecord_jdg_nro_entregas_propios', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_entrega_propio', null, 'sum')];
		
		var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_jdg', null, filters, columns);	
		objAcumulador.setFieldValue('custrecord_jdg_nro_entregas_propios', rsltComisionGroup[0].getValue(columns[0]));
		objAcumulador.setFieldValue('custrecord_jdg_entrega_propio', rsltComisionGroup[0].getValue(columns[1]));
		nlapiSubmitRecord(objAcumulador, true, true);
    }
    return preId;
}

function actualizaAcumuladoJDG(configuracionPrincipal, acumulaPuntos, salesRep, salesRepText, fc){
	nlapiLogExecution( 'DEBUG', "actualizaAcumuladoJDG ", '----- INICIO -----' );
	if(configuracionPrincipal && !acumulaPuntos){
    	//- Busca si tiene un acumulador creado previamente, sino la tiene debe crearla, si la tiene debe modificarla
    	var filters =[new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep), 
    				  new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc),
    				  new nlobjSearchFilter('custrecord9', null, 'is', configuracionPrincipal.id)];
    	
		var rsltAcumuladorPrincipal = nlapiSearchRecord('customrecord_comisiones_jdg', null, filters);
		var objAcumulador = null;
		
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			objAcumulador = nlapiLoadRecord('customrecord_comisiones_jdg', rsltAcumuladorPrincipal[0].id);
		} else {
			objAcumulador = nlapiCreateRecord('customrecord_comisiones_jdg');
			objAcumulador.setFieldValue('custrecord_jdg_empleado',salesRep);
			objAcumulador.setFieldValue('custrecord9', configuracionPrincipal.id);
			objAcumulador.setFieldValue('custrecord_jdg_nombre_empleado',salesRepText);
			objAcumulador.setFieldValue('custrecord_jdg_fecha_comision',fc);
		}
		
		//- Busca el total de comisiones generadas												
		var filters =[new nlobjSearchFilter('custrecord_jdg_empleado', null, 'is', salesRep), 
			  new nlobjSearchFilter('custrecord_jdg_fecha_comision', null, 'is', fc),
			  new nlobjSearchFilter('custrecordpuntosflag', 'custrecord9', 'is', 'F')];
		
		if(rsltAcumuladorPrincipal && rsltAcumuladorPrincipal.length > 0){
			filters.push(new nlobjSearchFilter('internalid', null, 'noneof', rsltAcumuladorPrincipal[0].id));
		}

		var columns = [new nlobjSearchColumn('custrecord_jdg_bono_manual', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_no_ventas_equipo', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_total_comisiones_equipo', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_no_ventas_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_compensacion_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_entrega_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_total_comisiones_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_x_maquina_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_no_ventas_esp_periodo', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_no_ventas_esp_acumulado', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_compensacion_especial', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_bono_propio', null, 'sum'),
					   new nlobjSearchColumn('custrecord_jdg_nro_entregas_propios', null, 'sum')];
		
		var rsltComisionGroup = nlapiSearchRecord('customrecord_comisiones_jdg', null, filters, columns);											
		objAcumulador.setFieldValue('custrecord_jdg_bono_manual', rsltComisionGroup[0].getValue(columns[0]));
		objAcumulador.setFieldValue('custrecord_jdg_no_ventas_equipo', rsltComisionGroup[0].getValue(columns[1]));
		objAcumulador.setFieldValue('custrecord_jdg_total_comisiones_equipo', rsltComisionGroup[0].getValue(columns[2]));
		objAcumulador.setFieldValue('custrecord_jdg_no_ventas_propio', rsltComisionGroup[0].getValue(columns[3]));
		objAcumulador.setFieldValue('custrecord_jdg_compensacion_propio', rsltComisionGroup[0].getValue(columns[4]));
		objAcumulador.setFieldValue('custrecord_jdg_entrega_propio', rsltComisionGroup[0].getValue(columns[5]));
		objAcumulador.setFieldValue('custrecord_jdg_total_comisiones_propio', rsltComisionGroup[0].getValue(columns[6]));
		objAcumulador.setFieldValue('custrecord_jdg_x_maquina_propio', rsltComisionGroup[0].getValue(columns[7]));
		objAcumulador.setFieldValue('custrecord_jdg_no_ventas_esp_periodo', rsltComisionGroup[0].getValue(columns[8]));
		objAcumulador.setFieldValue('custrecord_jdg_no_ventas_esp_acumulado', rsltComisionGroup[0].getValue(columns[9]));
		objAcumulador.setFieldValue('custrecord_jdg_compensacion_especial', rsltComisionGroup[0].getValue(columns[10]));
		objAcumulador.setFieldValue('custrecord_jdg_bono_propio', rsltComisionGroup[0].getValue(columns[11]));
		objAcumulador.setFieldValue('custrecord_jdg_nro_entregas_propios', rsltComisionGroup[0].getValue(columns[12]));
		nlapiSubmitRecord(objAcumulador, true, true);
    }
	nlapiLogExecution( 'DEBUG', "actualizaAcumuladoJDG ", '----- FIN -----' );
}