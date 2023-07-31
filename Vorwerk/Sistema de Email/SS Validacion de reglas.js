/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/record', 'N/render', 'N/search', 'N/email', 'N/runtime', './lib'],
/**
 * @param {format} format
 * @param {record} record
 * @param {render} render
 * @param {search} search
 */
function(format, record, render, search, email, runtime, lib) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
	
	var _INDEX_SELECCION = {
			_1:  0,//custrecord_pe_vn1
			_2:  1,//custrecord_pe_vn2
			_3:  2,//custrecord_pe_vn3
			_4:  3,//custrecord_pe_vn4
			_5:  4,//custrecord_pe_vn5
			_6:  5,//custrecord_pe_vn6
			_7:  6,//custrecord_pe_vn7
			_8:  7,//custrecord_pe_vn8
			_9:  8,//custrecord_pe_vn9
			_10: 9,//custrecord_pe_vn10
			_26: 10,//custrecord_pe_vn11
			_11: 11 ,//custrecord_pe_vn12
			_12: 12	,//custrecord_pe_vnt
			_13: 13	,//custrecord_pe_vm1
			_14: 14	,//custrecord_pe_vm2
			_15: 15	,//custrecord_pe_vm3
			_16: 16	,//custrecord_pe_vm4
			_17: 17	,//custrecord_pe_vm5
			_18: 18	,//custrecord_pe_vm6
			_19: 19	,//custrecord_pe_vm7
			_20: 20	,//custrecord_pe_vm8
			_21: 21	,//custrecord_pe_vm9
			_22: 22 ,//custrecord_pe_vm10
			_23: 23 ,//custrecord_pe_vm11
			_24: 24 ,//custrecord_pe_vm12
			_25: 25	,//custrecord_pe_vmt
	};
	
	var _SELECCION = [
		'custrecord_pe_vn1',
		'custrecord_pe_vn2',
		'custrecord_pe_vn3',
		'custrecord_pe_vn4',
		'custrecord_pe_vn5',
		'custrecord_pe_vn6',
		'custrecord_pe_vn7',
		'custrecord_pe_vn8',
		'custrecord_pe_vn9',
		'custrecord_pe_vn10',
		'custrecord_pe_vn11',
		'custrecord_pe_vn12',
		'custrecord_pe_vnt',
		'custrecord_pe_vm1',
		'custrecord_pe_vm2',
		'custrecord_pe_vm3',
		'custrecord_pe_vm4',
		'custrecord_pe_vm5',
		'custrecord_pe_vm6',
		'custrecord_pe_vm7',
		'custrecord_pe_vm8',
		'custrecord_pe_vm9',
		'custrecord_pe_vm10',
		'custrecord_pe_vm11',
		'custrecord_pe_vm12',
		'custrecord_pe_vmt',
	];
	
    function execute(scriptContext) {
		log.debug('INICIO execute', '--------------------------------------------------------');
    	var salesOrder = runtime.getCurrentScript().getParameter({name: 'custscript_salesorder'});
    	
    	
    	if(salesOrder){
    		//-- Carga datos de Orden de Venta
    		var _SO = record.load({type: 'salesorder', id: salesOrder});
    		
    		var fieldLookUpSO = search.lookupFields({
    			type: search.Type.SALES_ORDER,
    			id: salesOrder,
    			columns: ['salesrep', 
    				'entity',
    				'salesrep.custentity_fin_objetivo_1',
    				'salesrep.custentity_fin_objetivo_2',
    				'salesrep.hiredate',
    				'salesrep.custentity_se_fecha_conversion']
			});
    		
    		var _SALES_ORDER = {
    				id: salesOrder,
    				trandate: _SO.getValue('trandate'),
    				cliente: fieldLookUpSO.entity[0].value,
    				tipoVenta: _SO.getValue('custbody_tipo_venta'),
    				serial: _SO.getSublistValue({sublistId: 'item', fieldId: 'serialnumbers', line: 0})[0],
    				jdg: {
    					id: _SO.getValue('salesrep'),
    					obj1: fieldLookUpSO['salesrep.custentity_fin_objetivo_1'],
    					obj2: fieldLookUpSO['salesrep.custentity_fin_objetivo_2'],
    					hiredate: fieldLookUpSO['salesrep.hiredate'],
    					conversion: fieldLookUpSO['salesrep.custentity_se_fecha_conversion']
    				}
    		}
    		log.debug('serialnumbers',_SO.getSublistValue({sublistId: 'item', fieldId: 'serialnumbers', line: 0}));
    		log.debug('_SALES_ORDER',_SALES_ORDER);
    		//-----------------------------------------
    		//- Crea registro de promotora si no existe
    		var _PROMOTORA_EMAIL = null;
    		if(_SALES_ORDER.jdg.id){
    			_PROMOTORA_EMAIL = lib.obtenerPromotora(_SALES_ORDER.jdg.id, _SALES_ORDER.id, _SALES_ORDER.tipoVenta);
    		}
    		log.debug('_PROMOTORA_EMAIL',_PROMOTORA_EMAIL);
    		//-----------------------------------------
    		//- Crea registro de cliente si no existe
    		var _CLIENTE_EMAIL = null;
    		search.create({
        		type: 'customrecord_se_clientes_email',
        		filters: ['custrecord_ce_cliente','is', _SALES_ORDER.cliente]
        	}).run().each(function(r){
        		_CLIENTE_EMAIL= record.load({type: 'customrecord_se_clientes_email', id: r.id});
        	});
			
			if(!_CLIENTE_EMAIL){
				_CLIENTE_EMAIL = record.create({type: 'customrecord_se_clientes_email'});
				_CLIENTE_EMAIL.setValue('custrecord_ce_cliente', _SALES_ORDER.cliente);
			}
			    			
			_CLIENTE_EMAIL.setValue('custrecord_ce_transaccion', _SALES_ORDER.id);
			
			//-----------------------------------------
			//-- Valida reglas
    		search.create({
        		type: 'customrecord_se_reglas_email',
        		filters: ['isinactive','is', false],
        		columns: ['custrecord_re_base',//- Si aplica para Cliente(1) o Promotora(2)
        			'custrecord_re_fecha_base',
        			'custrecord_re_desde_promotora',
        			'custrecord_re_hasta_promotora',
        			'custrecord_re_condicion',
        			'custrecord_re_valor_objetivo',
        			'custrecord_re_base_envio',
        			'custrecord_re_valor_envio',
        			'custrecord_re_template']
        	}).run().each(function(regla){
//	        		log.debug('regla',regla);
        		
        		var base = regla.getValue('custrecord_re_base');    		
        		var desde = regla.getValue('custrecord_re_desde_promotora');    
        		var hasta = regla.getValue('custrecord_re_hasta_promotora');   
        		
        		var total = 0 ;
        		var indDesde = _INDEX_SELECCION['_'+desde];    
        		var indHasta = _INDEX_SELECCION['_'+hasta];  
        		log.debug('index','indDesde: ' + indDesde + ' | indHasta: ' + indHasta);
        		for(var i = indDesde; i <= indHasta; i++){
        			var fieldName = _SELECCION[i];
        			var valorActual = Number(_PROMOTORA_EMAIL.getValue(fieldName));
        			total += valorActual;
        			log.debug('for','fieldName: ' + fieldName + ' | valorActual: ' + valorActual + ' | total: ' + total);
        		}
        		
        		var objectivo = regla.getValue('custrecord_re_valor_objetivo');
        		var condicion = regla.getValue('custrecord_re_condicion');
        		var template = regla.getValue('custrecord_re_template');
        		log.debug('param','objectivo: ' +  objectivo + ' | condicion: ' + condicion + ' | total: ' + total);
        		try{
	        		if(condicion == lib._CONDICION.IGUAL && total == objectivo || 
	        				condicion == lib._CONDICION.MAYOR_O_IGUAL && total >= objectivo ||
	        				condicion == lib._CONDICION.MAYOR_QUE && total > objectivo ||
	        				condicion == lib._CONDICION.MENOR_QUE && total < objectivo ||
	        				condicion == lib._CONDICION.MENOR_O_IGUAL && total <= objectivo){
	        			
	        			//- Calculo de fecha de envio
	        			var valorEnvio = regla.getValue('custrecord_re_valor_envio');
	        			var baseEnvio = regla.getValue('custrecord_re_base_envio');
	        			var fechaBase = regla.getValue('custrecord_re_fecha_base');
	        			var fechaBaseObj = format.parse({value:_SALES_ORDER.trandate, type: format.Type.DATE});
	        			
	        			if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_DE_ALTA){
	        				fechaBaseObj = format.parse({value:_SALES_ORDER.jdg.hiredate, type: format.Type.DATE});
	        			} else if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_OBJ1){
	        				fechaBaseObj = format.parse({value:_SALES_ORDER.jdg.obj1, type: format.Type.DATE})
	        			} else if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_OBJ2){
	        				fechaBaseObj = format.parse({value:_SALES_ORDER.jdg.obj2, type: format.Type.DATE})
	        			} else if(fechaBase == lib._BASE.fecha_base.promotora.FECHA_CONVERSION){
	        				fechaBaseObj = format.parse({value:_SALES_ORDER.jdg.conversion, type: format.Type.DATE})
	        			}
	        			
	        			if(baseEnvio == 1){//Dias
	        				fechaBaseObj = new Date(fechaBaseObj.getTime() + (1000*60*60*24*valorEnvio));
	        			} else if(baseEnvio == 2){//Mes
	        				lib.addMonths(fechaBaseObj, valorEnvio)
	        			}
	        			
	        			//-----------------------------------
	        			
	        			
	        			//--Los promotora GTM son la que ya se convirtieron es decir el campo fecha de conversión está lleno
		            	if(base != lib._BASE.aplicado_a.CLIENTE &&  _PROMOTORA_EMAIL && 
		            			((base == lib._BASE.aplicado_a.GTM && _SALES_ORDER.jdg.conversion) || (base == lib._BASE.aplicado_a.TMP && !_SALES_ORDER.jdg.conversion))){
		            		var emailLogId = lib.createEmailLog(_SALES_ORDER.jdg.id, null, regla.id, template, _SALES_ORDER.id, fechaBaseObj, _SALES_ORDER.serial);
	            			log.debug('emailLogId 1',emailLogId);	
		            	} else if(base == lib._BASE.aplicado_a.CLIENTE ){
		            		var emailLogId = lib.createEmailLog(null, _SALES_ORDER.cliente, regla.id, template, _SALES_ORDER.id, fechaBaseObj, _SALES_ORDER.serial);
	            			log.debug('emailLogId 2',emailLogId);
		            	}	
		            	
		            	lib.sendEmail(baseEnvio, valorEnvio);
	        		}
        		
        		} catch(e){
            		log.debug('error',e);
            	}
        		return true;
        	});

        	if(_PROMOTORA_EMAIL){
        		_PROMOTORA_EMAIL.save();
        		log.debug('_PROMOTORA_EMAIL','almacenado.');
        	}
        	
        	if(_CLIENTE_EMAIL){
        		_CLIENTE_EMAIL.save();
        		log.debug('_CLIENTE_EMAIL','almacenado.');
        	}	        	
    	}
    	
    	log.debug('FIN execute', '--------------------------------------------------------');
    }
	
		
    return {
        execute: execute
    };
    
});
