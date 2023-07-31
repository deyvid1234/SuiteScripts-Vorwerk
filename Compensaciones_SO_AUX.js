function Compensaciones_SO_AUX(recordType,recordId)
{
	var _ce_aux_cue_csv_file			= nlapiLoadFile(411081);
	var _ce_aux_cue_csv_value			= _ce_aux_cue_csv_file.getValue();
	var esBase64Coded					= isBase64Coded(_ce_aux_cue_csv_value);	
	if(esBase64Coded == true)
	{
		_ce_aux_cue_csv_value			= Base64.decode(_ce_aux_cue_csv_value);
	}
	var _ce_aux_cue_csv_array			= stringToArray(_ce_aux_cue_csv_value,44);
		_ce_aux_cue_csv_array.pop();//Salto de linea vacio.
	var lines							= _ce_aux_cue_csv_array.length;
	var pl								= lines/100;
	for(var i=0;i<lines;i++)
	{
		try
		{
			var recordSO						= nlapiLoadRecord('salesorder', _ce_aux_cue_csv_array[i]);
			{
				if(returnBlank(recordSO.getFieldValue('salesrep')!=''))
				{
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
					var employee = returnBlank(nlapiSearchRecord('employee',null,filters,columns));
					if(employee!='')
					{
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
					}
					filters = new nlobjSearchFilter('internalid',null,'is',recordSO.getFieldValue('salesrep'));
					columns = new nlobjSearchColumn('supervisor');
					var resultsJDG = (nlapiSearchRecord("employee", null, filters, columns));
					if(resultsJDG!='')
					{
			
						var jefaGrupo = returnBlank(resultsJDG[0].getValue('supervisor'));
						if(jefaGrupo!='')
						{				
							filters = new nlobjSearchFilter('internalid',null,'is',resultsJDG[0].getValue('supervisor'));
							columns = new nlobjSearchColumn('email');
							var resultsJDG_Email = (nlapiSearchRecord("employee", null, filters, columns));
							if(resultsJDG_Email!='')
							{ 
								recordSO.setFieldValue('custbody_email_jefa_grupo',resultsJDG_Email[0].getValue('email'));
							}
						}
					}
				}
				else
				{
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
			}
			var id = nlapiSubmitRecord(recordSO, true, true);
			nlapiLogExecution('ERROR', 'id', id);
			var percent = pl*(i+1);
			percent 	= percent.toFixed(2);	
			var context	= nlapiGetContext();		
				context.setPercentComplete(percent);
		}
		catch(e)
		{
		  	if( e instanceof nlobjError )
		  	{
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
			}
		    else
		    {
		    	var errorString	 = e.toString();
		    	nlapiLogExecution( 'ERROR', 'unexpected error', errorString);   
	        }
	  	}
	}
}