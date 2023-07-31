function saveRecord()
{
	var LevelWord 	= '<LevelWord>';
	var help   		= 'Sí "' + LevelWord +' " aparece en color rojo esta cantidad' + String.fromCharCode(10) + 'no se tomará en cuenta para el cálculo de "Total"';
	var fec_V 		= nlapiGetFieldValue('custrecord_fecha_comision');
	var fc 			= nlapiGetFieldValue('custrecord_fecha_comision');
	var ec 			= nlapiGetFieldValue('custrecord_elegir_comision');
	var filters 	= new Array();
	var columns 	= new Array();
	var resultsJDG	= new Array();
	var resultsPRE 	= new Array();
	var resultsGTM 	= new Array();
    var x			= 0;
    var y			= 0;
    var lonJDG		= 0;
    var lonPRE 		= 0;
    var lonGTM		= 0;
    var b 			= new Boolean();
	var IDS 		= new String();
	/*if((fec_V.length==7) && (fec_V.charCodeAt(0)>=48 && fec_V.charCodeAt(0)<=57) && (fec_V.charCodeAt(1)>=48 && fec_V.charCodeAt(1)<=57) && (fec_V.charCodeAt(2)==47) && (fec_V.charCodeAt(3)>=48 && fec_V.charCodeAt(3)<=57) && (fec_V.charCodeAt(4)>=48 && fec_V.charCodeAt(4)<=57) && (fec_V.charCodeAt(5)>=48 && fec_V.charCodeAt(5)<=57) &&  (fec_V.charCodeAt(6)>=48 && fec_V.charCodeAt(6)<=57)) 
	{*/
		if(ec==1)
		{
			filters[0] = new nlobjSearchFilter('custrecord_jdg_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_jdg_fecha_comision',null, 'is', fc);
			resultsJDG = returnBlank(nlapiSearchRecord('customrecord_comisiones_jdg', null, filters, null));			
			if(resultsJDG!='')
			{
			    lonJDG =resultsJDG.length;
                for(x=0;x<lonJDG;x++)
                {
                	IDS += resultsJDG[x].getId()+String.fromCharCode(64);
                }
                LevelWord = 'Jefa de Grupo';
                help	  = help.split('<LevelWord>');
                help 	  = help.join(LevelWord);
                nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
                nlapiSetFieldValue('custrecord_help',help);
                return true;
			}
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
		if(ec==2)
		{
            filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
            filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
            columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
            resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));
            filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
            filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
            resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filters, null));
            if(resultsPRE!='')
            {
                lonPRE =resultsPRE.length;
                for(x=0;x<lonPRE;x++)
                {
                    IDS += resultsPRE[x].getId()+String.fromCharCode(64);
                }
                /*/
                var IDS =stringToArray(IDS,64);
                    IDS.pop();
                var ids_empleado_gtm_com_skip = new Array();
                for(g=0;g<resultsGTM.length;g++)
                {
                    ids_empleado_gtm_com_skip[g] = resultsGTM[g].getValue('custrecord_gtm_empleado');
                }
                for(var r = 0;r<IDS.length;r++)
                {
                    for(var g = 0;g<ids_empleado_gtm_com_skip.length;g++)
                    {
                        IDS = popArrayValue(IDS,ids_empleado_gtm_com_skip[g]);
                    }
                }
                IDS = IDS.join('@');
                /*/
                LevelWord = 'Presentadora';
                help	  = help.split('<LevelWord>');
                help 	  = help.join(LevelWord);
                nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
                nlapiSetFieldValue('custrecord_help',help);
                return true;
            }
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
		if(ec==4)
		{
			filters[0] = new nlobjSearchFilter('custrecord_gtm_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_gtm_fecha_comision',null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_gtm_empleado');
			resultsGTM = returnBlank(nlapiSearchRecord('customrecord_comisiones_gtm', null, filters, columns));
			filters[0] = new nlobjSearchFilter('custrecord_pre_empleado', null, 'noneof', '@NONE@');
			filters[1] = new nlobjSearchFilter('custrecord_pre_fecha_comision',null, 'is', fc);
			columns[0] = new nlobjSearchColumn('custrecord_pre_empleado');
			resultsPRE = returnBlank(nlapiSearchRecord('customrecord_comisiones_pre', null, filters, columns));
			var IDS = '';
			if(resultsGTM!='')
			{
			    lonGTM = resultsGTM.length;
			    lonPRE = resultsPRE.length;
                for(x=0;x<lonGTM;x++)
                {
			    	for(y=0;y<lonPRE;y++)
		            {
		            	if(resultsPRE[y].getValue('custrecord_pre_empleado') == resultsGTM[x].getValue('custrecord_gtm_empleado'))
		            	{ b = true; break;}
		            	else
		            	{ b = false; }
		            }
		            if(b==false) 
		            { 
		            	IDS += resultsGTM[x].getId() + String.fromCharCode(64); 
		            }
                }
                if(IDS!='')
                {
                    LevelWord = 'Presentadora';
                    help	  = help.split('<LevelWord>');
                    help 	  = help.join(LevelWord);
                    nlapiSetFieldValue('custrecord_enlace_detalle_id',IDS);
                    nlapiSetFieldValue('custrecord_help',help);
	                return true;
	            }
	            else
	            {
	            	alert('Ha existido un cambio de esquema en las presentadoras, cambie el campo \"Elegir Comision\" a \"Presentadora\" para ver resultados agrupados.');
	            	return false;
	            }
			}
			else
			{ 
				alert('Sin resultados, revise criterios');
				return false; 
			}
		}
	/*}
	else 
	{ 
		alert('Formato invalido para \"Periodo Comision\", debe ser MM/AAAA.');
		return false; 
	}*/
}