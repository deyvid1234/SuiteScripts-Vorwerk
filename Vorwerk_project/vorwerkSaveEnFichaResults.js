/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
		[ 'N/search', 'N/record', 'N/ui/serverWidget' ],

		function(search, record, serverWidget) {

			/**
			 * Definition of the Suitelet script trigger point.
			 * 
			 * @param {Object}
			 *            context
			 * @param {ServerRequest}
			 *            context.request - Encapsulation of the incoming
			 *            request
			 * @param {ServerResponse}
			 *            context.response - Encapsulation of the Suitelet
			 *            response
			 * @Since 2015.2
			 */
			function onRequest(context) {
				var form = serverWidget.createForm({
					title : 'Reporte de Comisiones'
				});
				form.addField({
					id : 'custpage_date',
					type : serverWidget.FieldType.SELECT,
					label : 'Periodo de comision',
					source : 'customrecord_periods',
					container : 'custpage_filters'
				});
				form.addSubmitButton({
					label : 'Consultar',
					container : 'custpage_filters'
				});
				if (context.request.method == 'GET') {
					context.response.writePage(form);
				} else if (context.request.method == 'POST') {
					context.response.writePage(form);
					var obj_detail = [];

					var mySearch = search.load({
						id : 'customsearch945'
					});

					
					log.debug('level', mySearch);
					var pagedResults = mySearch.runPaged();
					pagedResults.pageRanges.forEach(function(pageRange) {
								var currentPage = pagedResults.fetch({
									index : pageRange.index
								});
								currentPage.data.forEach(function(result) {
//								log.debug('level', result.getText('custentityregional_manager'));
								obj_detail.push({
									regional_manager :!result.getText('custentityregional_manager')?" ": result.getText('custentityregional_manager'),
			    					area_manager : !result.getText('custentity_area_manager')?" ":result.getText('custentity_area_manager'),
			    					branch_office: !result.getText('location')?" ":result.getText('location'),
									office : !result.getText('office')?" ":result.getText('office'),
									manager : !result.getText('custentity_delegada')?" ":result.getText('custentity_delegada'),
									team_leader : !result.getText('supervisor')?" ":result.getText('supervisor'),
									unit_name : !result.getText('custentity_nombre_unidad')?" ":result.getText('custentity_nombre_unidad'),
									idu : !result.getText('entityid')?" ":result.getText('entityid'),
									presenter : !result.getText('altname')?" ":result.getText('altname'),
									first_name : !result.getText('firstname')?" ":result.getText('firstname'),
									last_name : !result.getText('lastname')?" ":result.getText('lastname'),
									entry : !result.getText('hiredate')?" ":result.getText('hiredate'),
									reactivation_date : !result.getText('custentity72')?" ":result.getText('custentity72'),
									recruiter : !result.getText('custentity_reclutadora')?" ":result.getText('custentity_reclutadora'),
									promotion : !result.getText('custentity_promocion')?" ":result.getText('custentity_promocion'),
									email : !result.getText('email')?" ":result.getText('email'),
									phone : !result.getText('phone')?" ":result.getText('phone'),
									mobile_phone : !result.getText('mobilephone')?" ":result.getText('mobilephone'),
									iterview_date : !result.getText('custentity_fent')?" ":result.getText('custentity_fent'),
									formation1_date : !result.getText('custentity_fch_form1')?" ":result.getText('custentity_fch_form1'),
									formation2_date : !result.getText('custentity_fch_form2')?" ":result.getText('custentity_fch_form2'),
									address : !result.getText('billaddress')?" ":result.getText('billaddress'),
									shipping_state : !result.getText('shipstate')?" ":result.getText('shipstate'),
									type_income : !result.getText('custentity_tipo_ingreso')?" ":result.getText('custentity_tipo_ingreso'),
									comments : !result.getText('custentity_comentarios')?" ":result.getText('custentity_comentarios'),
									type : !result.getText('employeetype')?" ":result.getText('employeetype'),
									income_compensation : !result.getText('assign_bank_letter')?" ":result.getText('assign_bank_letter'),
									assign_bank_letter : !result.getText('custentity_es_monedero')?" ":result.getText('custentity_es_monedero'),
									junior_start_date : !result.getText('custentity_fcha_inic_le_jr')?" ":result.getText('custentity_fcha_inic_le_jr'),
									low_date : !result.getText('custentity59')?" ":result.getText('custentity59'),
									last_low_date : !result.getText('custentity104')?" ":result.getText('custentity104'),
									created_date : !result.getText('datecreated')?" ":result.getText('datecreated'),
									last_modified_date : !result.getText('lastmodifieddate')?" ":result.getText('lastmodifieddate'),
									photo : !result.getText('custentity_foto')?" ":result.getText('custentity_foto'),
									deposit : !result.getText('custentity_deposito')?" ":result.getText('custentity_deposito'),
									cash : !result.getText('custentity_en_efectivo')?" ":result.getText('custentity_en_efectivo'),
									return_to_presenter : !result.getText('custentity_dev_garantia_a_presentador')?" ":result.getText('custentity_dev_garantia_a_presentador'),
									tm_service_recived : !result.getText('custentity_tm_servicio_recibida')?" ":result.getText('custentity_tm_servicio_recibida')
								});
							});
					});
					
					log.debug('finUNO', obj_detail);
					sublista(form, obj_detail)
					
					return true;

				}
			}
			function sublista(form, obj_detail) {
				try {
					form.addTab({
						id : 'custpage_subtab_detail',
						label : 'Detalle'
					});
					var sublist = form.addSublist({
						id : 'sublist',
						type : serverWidget.SublistType.LIST,
						label : 'Resultados',
						tab : 'custpage_subtab_detail'
					});
					var regional_manager = sublist.addField({
						id : 'regional_manager',
						type : serverWidget.FieldType.TEXT,
						label : 'REGIONAL MANAGER'
					});
					var name = sublist.addField({
						id : 'nombre',
						type : serverWidget.FieldType.TEXT,
						label : 'AREA MANAGER'
					});
					var area_manager = sublist.addField({
						id : 'area_manager',
						type : serverWidget.FieldType.TEXT,
						label : 'AREA MANAGER'
					});
					var branch_office = sublist.addField({
						id : 'branch_office',
						type : serverWidget.FieldType.TEXT,
						label : 'SUCURSAL'
					});
					var office = sublist.addField({
						id : 'office',
						type : serverWidget.FieldType.TEXT,
						label : 'OFICINA'
					});
					var manager = sublist.addField({
						id : 'manager',
						type : serverWidget.FieldType.TEXT,
						label : 'GERENTE'
					});
					var team_leader = sublist.addField({
						id : 'team_leader',
						type : serverWidget.FieldType.TEXT,
						label : 'LÍDER EQUIPO'
					});
					var unit_name = sublist.addField({
						id : 'unit_name',
						type : serverWidget.FieldType.TEXT,
						label : 'NOMBRE UNIDAD'
					});
					var idu = sublist.addField({
						id : 'idu',
						type : serverWidget.FieldType.TEXT,
						label : 'IDU'
					});
					var presenter = sublist.addField({
						id : 'presenter',
						type : serverWidget.FieldType.TEXT,
						label : 'PRESENTADOR'
					});
					var first_name = sublist.addField({
						id : 'first_name',
						type : serverWidget.FieldType.TEXT,
						label : 'FIRST NAME'
					});
					var last_name = sublist.addField({
						id : 'last_name',
						type : serverWidget.FieldType.TEXT,
						label : 'LAST NAME'
					});
					var entry = sublist.addField({
						id : 'entry',
						type : serverWidget.FieldType.TEXT,
						label : 'ALTA'
					});
					var reactivation_date = sublist.addField({
						id : 'reactivation_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA REACTIVACION'
					});
					var recruiter = sublist.addField({
						id : 'recruiter',
						type : serverWidget.FieldType.TEXT,
						label : 'RECLUTADORA'
					});
					var promotion = sublist.addField({
						id : 'promotion',
						type : serverWidget.FieldType.TEXT,
						label : 'PROMOCION'
					});
					var email = sublist.addField({
						id : 'email',
						type : serverWidget.FieldType.TEXT,
						label : 'EMAIL'
					});
					var phone = sublist.addField({
						id : 'phone',
						type : serverWidget.FieldType.TEXT,
						label : 'PHONE'
					});
					var mobile_phone = sublist.addField({
						id : 'mobile_phone',
						type : serverWidget.FieldType.TEXT,
						label : 'MOBILE PHONE'
					});
					var iterview_date = sublist.addField({
						id : 'iterview_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA DE ENTREVISTA'
					});
					var formation1_date = sublist.addField({
						id : 'formation1_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA FORMACIÓN I'
					});
					var formation2_date = sublist.addField({
						id : 'formation2_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA FORMACIÓN II'
					});
					var address = sublist.addField({
						id : 'address',
						type : serverWidget.FieldType.TEXT,
						label : 'ADDRESS'
					});
					var shipping_state = sublist.addField({
						id : 'shipping_state',
						type : serverWidget.FieldType.TEXT,
						label : 'SHIPPING STATE/PROVINCE'
					});
					var type_income = sublist.addField({
						id : 'type_income',
						type : serverWidget.FieldType.TEXT,
						label : 'TIPO DE INGRESO'
					});
					var comments = sublist.addField({
						id : 'comments',
						type : serverWidget.FieldType.TEXT,
						label : 'COMENTARIOS'
					});
					var type = sublist.addField({
						id : 'type',
						type : serverWidget.FieldType.TEXT,
						label : 'TYPE'
					});
					var income_compensation = sublist.addField({
						id : 'income_compensation',
						type : serverWidget.FieldType.TEXT,
						label : 'COMPENSACIONES DE INGRESO'
					});
					var assign_bank_letter = sublist.addField({
						id : 'assign_bank_letter',
						type : serverWidget.FieldType.TEXT,
						label : 'ASIGNAR CARTA BANCARIA'
					});
					var junior_start_date = sublist.addField({
						id : 'junior_start_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA INICIO DE JUNIOR'
					});
					var low_date = sublist.addField({
						id : 'low_date',
						type : serverWidget.FieldType.TEXT,
						label : 'FECHA DE BAJA'
					});
					var last_low_date = sublist.addField({
						id : 'last_low_date',
						type : serverWidget.FieldType.TEXT,
						label : 'ULTIMA BAJA'
					});
					var created_date = sublist.addField({
						id : 'created_date',
						type : serverWidget.FieldType.TEXT,
						label : 'DATE CREATED'
					});
					var last_modified_date = sublist.addField({
						id : 'last_modified_date',
						type : serverWidget.FieldType.TEXT,
						label : 'LAST MODIFIED'
					});
					var photo = sublist.addField({
						id : 'photo',
						type : serverWidget.FieldType.TEXT,
						label : 'FOTO'
					});
					var deposit = sublist.addField({
						id : 'deposit',
						type : serverWidget.FieldType.TEXT,
						label : 'DEPOSITO'
					});
					var cash = sublist.addField({
						id : 'cash',
						type : serverWidget.FieldType.TEXT,
						label : 'EN EFECTIVO'
					});
					var return_to_presenter = sublist.addField({
						id : 'return_to_presenter',
						type : serverWidget.FieldType.TEXT,
						label : 'DEVOLUCION DE GARANTIA A PRESENTADOR'
					});
					var tm_service_recived = sublist.addField({
						id : 'tm_service_recived',
						type : serverWidget.FieldType.TEXT,
						label : 'TM DE SERVICIO RECIBIDA'
					});
					sublist.addMarkAllButtons();
					
					log.debug("obj3", obj_detail.length);
					 for(var x = 0; x< obj_detail.length; x++ ){
						log.debug("obj", x);
						log.debug("regional",
								obj_detail[x].regional_manager);
						sublist.setSublistValue({
							id : 'regional_manager',
							line : x,
							value : obj_detail[x].regional_manager
						});
						sublist.setSublistValue({
							id : 'area_manager',
							line : x,
							value : obj_detail[x].area_manager
						});
						sublist.setSublistValue({
							id : 'branch_office',
							line : x,
							value : obj_detail[x].branch_office
						});
						sublist.setSublistValue({
							id : 'office',
							line : x,
							value : obj_detail[x].office
						});
						sublist.setSublistValue({
							id : 'manager',
							line : x,
							value : obj_detail[x].manager
						});
						sublist.setSublistValue({
							id : 'team_leader',
							line : x,
							value : obj_detail[x].team_leader
						});
						sublist.setSublistValue({
							id : 'unit_name',
							line : x,
							value : obj_detail[x].unit_name
						});
						sublist.setSublistValue({
							id : 'idu',
							line : x,
							value : obj_detail[x].idu
						});
						sublist.setSublistValue({
							id : 'presenter ',
							line : x,
							value : obj_detail[x].presenter
						});
						sublist.setSublistValue({
							id : 'first_name ',
							line : x,
							value : obj_detail[x].first_name
						});
						sublist.setSublistValue({
							id : 'last_name ',
							line : x,
							value : obj_detail[x].last_name
						});
						sublist.setSublistValue({
							id : 'entry ',
							line : x,
							value : obj_detail[x].entry
						});
						sublist.setSublistValue({
							id : 'reactivation_date',
							line : x,
							value : obj_detail[x].reactivation_date
						});
						sublist.setSublistValue({
							id : 'recruiter',
							line : x,
							value : obj_detail[x].recruiter
						});
						sublist.setSublistValue({
							id : 'promotion',
							line : x,
							value : obj_detail[x].promotion
						});
						sublist.setSublistValue({
							id : 'email',
							line : x,
							value : obj_detail[x].email
						});
						sublist.setSublistValue({
							id : 'phone',
							line : x,
							value : obj_detail[x].phone
						});
						sublist.setSublistValue({
							id : 'mobile_phone',
							line : x,
							value : obj_detail[x].mobile_phone
						});
						sublist.setSublistValue({
							id : 'iterview_date',
							line : x,
							value : obj_detail[x].iterview_date
						});
						sublist.setSublistValue({
							id : 'formation1_date',
							line : x,
							value : obj_detail[x].formation1_date
						});
						sublist.setSublistValue({
							id : 'formation2_date',
							line : x,
							value : obj_detail[x].formation2_date
						});
						sublist.setSublistValue({
							id : 'address',
							line : x,
							value : obj_detail[x].address
						});
						sublist.setSublistValue({
							id : 'shipping_state',
							line : x,
							value : obj_detail[x].shipping_state
						});
						sublist.setSublistValue({
							id : 'type_income',
							line : x,
							value : obj_detail[x].type_income
						});
						sublist.setSublistValue({
							id : 'comments',
							line : x,
							value : obj_detail[x].comments
						});
						sublist.setSublistValue({
							id : 'type',
							line : x,
							value : obj_detail[x].type
						});
						sublist.setSublistValue({
							id : 'income_compensation',
							line : x,
							value : obj_detail[x].income_compensation
						});
						sublist.setSublistValue({
							id : 'assign_bank_letter',
							line : x,
							value : obj_detail[x].assign_bank_letter
						});
						sublist.setSublistValue({
							id : 'junior_start_date',
							line : x,
							value : obj_detail[x].junior_start_date
						});
						sublist.setSublistValue({
							id : 'low_date',
							line : x,
							value : obj_detail[x].low_date
						});
						sublist.setSublistValue({
							id : 'last_low_date',
							line : x,
							value : obj_detail[x].last_low_date
						});
						sublist.setSublistValue({
							id : 'created_date',
							line : x,
							value : obj_detail[x].created_date
						});
						sublist.setSublistValue({
							id : 'last_modified_date',
							line : x,
							value : obj_detail[x].last_modified_date
						});
						sublist.setSublistValue({
							id : 'photo',
							line : x,
							value : obj_detail[x].photo
						});
						sublist.setSublistValue({
							id : 'deposit',
							line : x,
							value : obj_detail[x].deposit
						});
						sublist.setSublistValue({
							id : 'cash',
							line : x,
							value : obj_detail[x].cash
						});
						sublist.setSublistValue({
							id : 'return_to_presenter',
							line : x,
							value : obj_detail[x].return_to_presenter
						});
						sublist.setSublistValue({
							id : 'tm_service_recived',
							line : x,
							value : obj_detail[x].tm_service_recived
						});
					}

				} catch (err) {
					log.error("error", err)
				}
			}
			return {
				onRequest : onRequest
			};

		});
