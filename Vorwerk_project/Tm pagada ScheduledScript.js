/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define([ 'N/search', 'N/record', 'N/format' ],

function(search, record, format) {

	/**
	 * Definition of the Scheduled script trigger point.
	 * 
	 * @param {Object}
	 *            scriptContext
	 * @param {string}
	 *            scriptContext.type - The context in which the script is
	 *            executed. It is one of the values from the
	 *            scriptContext.InvocationType enum.
	 * @Since 2015.2
	 */
	function execute(scriptContext) {
		searchrec()

	}
	

	function compareDates(date1,date2) {
		try{
		  // log.debug('date1 '+date1,'date1 '+date2);
		  var dayInMillis=24*3600000;
		  // Nos quedamos con los días completos pasados desde el 1 de enero de 1970
		  var days1=Math.floor(date1.getTime()/dayInMillis);
		  var days2=Math.floor(date2.getTime()/dayInMillis);
		  // comparamos los días
		  if (days1>days2) {
		    return 1;
		  } else if (days1<days2) {
		    return -1;
		  }
		  return 0;
		}catch(e){
			log.debug('Error compareDates',e)
		}
	 
	}
	function searchrec() {
		try {
			var d = '';
			var type2 = [];
			var int_aux = {};
			var typeDigital = [];
			var time = new Date();
			var fda = format.parse({
				value : time,
				type : format.Type.DATE
			})
			log.debug('hoy', fda)
			var int = {};
			var odv = {};
			var rep = [];
			log.debug('0')
			var busqueda = search.create({
				type : 'employee',
				columns : [ 
				            'internalid',
				            'custentity_reclutadora',
				            'custentityregional_manager',
				            {name : 'isinactive',join : 'custentity_reclutadora'}, 
				            'hiredate',
				            'custentity_fin_objetivo_2',
				            'custentity_fin_objetivo_1' 
				           ],
				filters : [ 
				            ['custentity_promocion','is','1'],
				            'and', 
				            [ 'isinactive', 'is', false ]
				           ]
			});
			log.debug('1')
			busqueda.run().each(function(r) {
				rep.push({
					internalid : r.getValue('internalid'),
					reclutadora : r.getValue('custentity_reclutadora'),
					manager : r.getValue('custentityregional_manager'),
					rec : r.getValue({name : 'isinactive',join : 'custentity_reclutadora'}),
					date : r.getValue('hiredate'),
					dateend : r.getValue('custentity_fin_objetivo_2'),
					dateend1 : r.getValue('custentity_fin_objetivo_1')

				})
				return true;
			});
			log.debug('2 rep',rep)
			for (var i = 0; i < rep.length; i++) {
				log.debug('3',rep[i])
				try{
					var d = format.parse({
					value : rep[i].dateend,
					type : format.Type.DATE
					})
					log.debug('rep[i].dateend',rep[i].dateend)
					log.debug('d',d)
					var date = new Date(d);
					log.debug('date',date)
					var date_2 = dateDelivery(3, d)
					log.debug('date_2',date_2)
					log.debug('rep[i].date',rep[i].date)
					

					/*var d_aux = format.format({
						value : rep[i].date,
						type : format.Type.DATE
					})*/
					var d_aux = new Date(rep[i].date);


					log.debug('d_aux',d_aux)
					var fd = format.parse({
						value : date_2,
						type : format.Type.DATE
					})
					log.debug('fd',fd)
					var direrence = compareDates(fda,fd)
					log.debug('direrence',direrence)
					if(direrence == 1 || direrence == 0){
						//log.debug(rep[i].internalid+'--'+direrence,fda+"  ----   "+fd)
						int[rep[i].internalid] = true
					}
				}catch(e){
					log.debug('error fr',e)
				}
				

			}
			log.debug('4',int)
			int_aux = Object.keys(int)
			var newSearch = search.create({
				type : 'salesorder',
				columns : [
				           	'internalid', 
				            'custbody_tipo_venta', 
				            'tranid',
				            'custbody_vw_recruiter',
				            'salesrep',
				            'trandate', 
				            {name : 'hiredate',join : 'salesrep'},
				            {name : 'custentity_reclutadora',join : 'salesrep'},
							{name : 'isinactive',join : 'custbody_vw_recruiter'},
							{name : 'custentity_delegada',join : 'salesrep'},
						],
				filters : [ 
				            [ 'salesrep', 'anyof', int_aux ], 
				            'and',
				            [ 'mainline', 'is', true ],
				            'and',
				            ['custbody_tipo_venta','anyof',[33,35]]
				          ]
			});

			newSearch.run().each(function(r) {
				var tra = format.parse({
					value : r.getValue('trandate'),
					type : format.Type.DATE
				})
				var hire = format.parse({
					value : r.getValue({
						name : 'hiredate',
						join : 'salesrep'
					}),
					type : format.Type.DATE
				})
				
				var reclu_valid = r.getValue('custbody_vw_recruiter')
				if(reclu_valid == ""){
					log.debug("esta vacia",r.getValue('internalid'));
					reclu_valid = r.getValue({name : 'custentity_reclutadora',join : 'salesrep'});
				}
				
				if(r.getValue({name : 'isinactive',join : 'custbody_vw_recruiter'}) == true){
					log.debug("esta inactiva",r.getValue('custbody_vw_recruiter'));
					reclu_valid = r.getValue({name : 'custentity_delegada',join : 'salesrep'})
				}
				
				if (r.getValue('salesrep') in odv) {	
					if (tra >= hire) {
						odv[r.getValue('salesrep')].push({
							internalid : r.getValue('internalid'),
							typeso : r.getValue('custbody_tipo_venta'),
							tranid : r.getValue('tranid'),
							reclutadora : reclu_valid

						})
					}
				} else {
					if (tra >= hire) {
						odv[r.getValue('salesrep')] = [ {
							internalid : r.getValue('internalid'),
							typeso : r.getValue('custbody_tipo_venta'),
							tranid : r.getValue('tranid'),
							reclutadora : reclu_valid
						} ]
					}
				}
				return true;
			});
			log.debug('odv', odv)

			for ( var x in odv) {
				for ( var y in odv[x]) {
					if (odv[x][y].typeso == 35 || odv[x][y].typeso == 33) {
						
						for ( var z in rep) {
							if (rep[z].internalid == x) {
								try{
									
									 var objRecord = record.load({//Carg registro
										 type: 'salesorder',
										 id: odv[x][y].internalid,
										 isDynamic: false
									 });
									 
									 objRecord.setValue('custbody_presentadora_tm_paga',rep[z].internalid);
									 objRecord.setValue('salesrep',odv[x][y].reclutadora);
									 objRecord.setValue('custbody_tipo_venta','19');
									 objRecord.setValue('trandate',fda);
									 
									 var id_mod = objRecord.save();
									 log.debug(odv[x][y].typeso+' id odv encontrada '+rep[z].internalid +'  modf'+id_mod,odv[x][y].internalid+' reclu '+odv[x][y].reclutadora);
								
								}catch(err_save){
									log.error("Error save odv",err_save);
								}
								
							}
						}
					} else {
						type2.push({
							internal : odv[x][y].internalid,
							rep : odv[x][y].sales
						})
					}

				}

			}

		} catch (err) {
			log.error('searchrec', err)
		}
	}

	function dateDelivery(dia, date) {
		try{
			// m�todo para sumar n dias (que no sean ni S�bado ni Domingo)
			Date.prototype.sumarLaborables = function(n) {
				for (var i = 0; i < n; i++) {
					this.setTime(this.getTime() + 24 * 60 * 60 * 1000);
					if ((this.getDay() == 6) || (this.getDay() == 0)) // s�bado o
																		// domingo
						i--; // hacemos el bucle una unidad mas larga.
				}
				return this;
			}
			return new Date(date).sumarLaborables(dia);
		}catch(e){
			log.debug('Error dateDelivery',e)
		}
		
	}

	return {
		execute : execute
	};

});
