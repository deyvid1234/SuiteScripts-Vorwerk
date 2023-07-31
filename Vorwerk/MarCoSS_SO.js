function MarCoSS_SO_AfterSubmit(type)
{
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type != 'delete')
		{
			var salesorder_record				= nlapiLoadRecord(recordType,recordId);
			var salesrep						= returnBlank(salesorder_record.getFieldValue('salesrep'));
			var entity							= returnBlank(salesorder_record.getFieldValue('entity'));
			var _marcoss						= returnBlank(salesorder_record.getFieldValue('custbody_marcoss'));
			var _marcoss_record					= '';
			var _marcoss_registro_enviado		= 'F';
			if(_marcoss != '')
			{
				_marcoss_record				= nlapiLoadRecord('customrecord_marcoss',_marcoss);
				_marcoss_registro_enviado	= returnFalse(_marcoss_record.getFieldValue('custrecord_marcoss_registro_enviado'));
			}
			else
			{
				_marcoss_record	= nlapiCreateRecord('customrecord_marcoss');	
			}
			if(_marcoss_record != '' && _marcoss_registro_enviado == 'F')
			{
				var advisor_record				= nlapiLoadRecord('employee',salesrep);
				var advisor_timeStamp			= nlapiDateToString(new Date());
					advisor_timeStamp			= stringDateTimeSF(advisor_timeStamp);
				var advisor_advisorID			= returnBlank(advisor_record.getFieldValue('entityid'));
				var advisor_status				= returnBlank(advisor_record.getFieldText('custentity_advisor_status'));
				var advisor_position			= returnBlank(advisor_record.getFieldText('employeetype'));
				var advisor_division			= returnBlank(advisor_record.getFieldValue('custentity_advisor_division'));
				var advisor_first_name			= returnBlank(advisor_record.getFieldValue('firstname'));
				var advisor_last_name			= returnBlank(advisor_record.getFieldValue('lastname'));
				var advisor_salutation			= returnBlank(advisor_record.getFieldValue('salutation'));
				if(advisor_salutation == '')
				{
					advisor_salutation = 'Sr/Sra.';
				}
				var advisor_email				= returnBlank(advisor_record.getFieldValue('email'));
				var advisor_phone				= returnBlank(advisor_record.getFieldValue('phone'));
				if(advisor_phone != '')
				{
					advisor_phone = '+52' + advisor_phone;
				}
				var advisor_mobilephone			= returnBlank(advisor_record.getFieldValue('mobilephone'));
				if(advisor_mobilephone != '')
				{
					advisor_mobilephone = '+52' + advisor_mobilephone;
				}
				var order_timeStamp				= nlapiDateToString(new Date());
					order_timeStamp				= stringDateTimeSF(order_timeStamp);
				var order_order_id				= returnBlank(salesorder_record.getFieldValue('tranid'));
				var order_order_entry_date		= returnBlank(salesorder_record.getFieldValue('trandate'));
					order_order_entry_date		= stringDateTimeSF(order_order_entry_date);
				var order_order_status			= returnBlank(salesorder_record.getFieldText('custbody_order_status'));
				var order_order_items			= returnBlank(salesorder_record.getLineItemCount('item'));
				var order_order_total_price		= returnBlank(salesorder_record.getFieldValue('subtotal'));
				var order_order_delivery_date	= returnBlank(salesorder_record.getFieldValue('shipdate'));
				if(order_order_delivery_date == '')
				{
					order_order_delivery_date	= new Date();
					order_order_delivery_date	= nlapiDateToString(order_order_delivery_date);
					order_order_delivery_date	= stringDateTimeSF(order_order_delivery_date);
				}
				else
				{
					order_order_delivery_date	= stringDateTimeSF(order_order_delivery_date);
				}
				var customer_record				= nlapiLoadRecord('customer',entity);
				var	customer_timeStamp			= nlapiDateToString(new Date());
					customer_timeStamp			= stringDateTimeSF(customer_timeStamp);
				var customer_customerID			= returnBlank(customer_record.getFieldValue('entityid'));
				var customer_division			= returnBlank(customer_record.getFieldValue('custentity_customer_division'));
				var customer_first_name			= returnBlank(customer_record.getFieldValue('firstname'));
				var customer_last_name			= returnBlank(customer_record.getFieldValue('lastname'));
				var customer_salutation			= returnBlank(customer_record.getFieldValue('salutation'));
				if(customer_salutation == '')
				{
					customer_salutation = 'Sr/Sra.';
				}
				var customer_advisor			= returnFalse(customer_record.getFieldValue('custentity_espre'));
				if(customer_advisor == 'F')
				{
					customer_advisor = "false";
				}
				else
				{
					customer_advisor = "true";
				}
				if(customer_last_name == '')
				{
					customer_last_name		= returnBlank(customer_record.getFieldValue('custentity_razon_social'));	
				}
				var customer_company_name		= returnBlank(customer_record.getFieldValue('custentity_razon_social'));
				var customer_vat_number			= returnBlank(customer_record.getFieldValue('vatregnumber'));
				var customer_opt_in				= returnFalse(customer_record.getFieldValue('custentity_customer_opt_in'));
				if(customer_opt_in == 'F')
				{
					customer_opt_in = "false";
				}
				else
				{
					customer_opt_in = "true";
				}
				var customer_mobilephone		= returnBlank(customer_record.getFieldValue('mobilephone'));
				if(customer_mobilephone != '')
				{
					customer_mobilephone = '+52' + customer_mobilephone;
				}
				var customer_email				= returnBlank(customer_record.getFieldValue('email'));
				var filters_customer_bill_addr	= new Array();
					filters_customer_bill_addr.push(new nlobjSearchFilter('internalid',null,'is',entity));
				var results_customer_bill_addr	= nlapiSearchRecord('customer', 'customsearch_marcoss_customer_bill_addr', filters_customer_bill_addr, null);
				var customer_billing_address1	= returnBlank(results_customer_bill_addr[0].getValue('address1','address'));
				var customer_billing_address2	= returnBlank(results_customer_bill_addr[0].getValue('address2','address'));
				var customer_billing_zip		= returnBlank(results_customer_bill_addr[0].getValue('zipcode','address'));
				var customer_billing_city		= returnBlank(results_customer_bill_addr[0].getValue('city','address'));
				var filters_customer_ship_addr	= new Array();
					filters_customer_ship_addr.push(new nlobjSearchFilter('internalid',null,'is',entity));
				var results_customer_ship_addr	= nlapiSearchRecord('customer', 'customsearch_marcoss_customer_ship_addr', filters_customer_ship_addr, null);
				var customer_shiping_address1	= returnBlank(results_customer_ship_addr[0].getValue('address1','address'));
				var customer_shiping_address2	= returnBlank(results_customer_ship_addr[0].getValue('address2','address'));
				var customer_shiping_zip		= returnBlank(results_customer_ship_addr[0].getValue('zipcode','address'));
				var customer_shiping_city		= returnBlank(results_customer_ship_addr[0].getValue('city','address'));
				var strName						= '';
					strName					   += '<acquisition>';
						strName					   += '<advisor>';
							strName					   += '<timeStamp>' 			+ EscapeXML(advisor_timeStamp) 	+ '</timeStamp>';
							strName					   += '<advisorID>' 			+ EscapeXML(advisor_advisorID)	 	+ '</advisorID>';
							strName					   += '<status>' 				+ EscapeXML(advisor_status)	 	+ '</status>';
							strName					   += '<position>' 				+ EscapeXML(advisor_position)	 	+ '</position>';
							strName					   += '<division>' 				+ EscapeXML(advisor_division)	 	+ '</division>';
							strName					   += '<firstName>' 			+ EscapeXML(advisor_first_name) 	+ '</firstName>';
							strName					   += '<lastName>' 				+ EscapeXML(advisor_last_name)	 	+ '</lastName>';
							strName					   += '<salutation>'		 	+ EscapeXML(advisor_salutation) 	+ '</salutation>';
							strName					   += '<email>' 				+ EscapeXML(advisor_email)			+ '</email>';
							if(advisor_phone != '')
							{
								strName					   += '<phoneNumber>' 			+ EscapeXML(advisor_phone) 		+ '</phoneNumber>';
							}
							if(advisor_mobilephone != '')
							{
								strName					   += '<mobilePhoneNumber>' 	+ EscapeXML(advisor_mobilephone) 	+ '</mobilePhoneNumber>';
							}
							strName					   += '<placeholders>';
								strName					   += '<placeholder>';
									strName					   += '<key>'		+ "key1" 	+ '</key>';
									strName					   += '<value>' 	+ "value1" 	+ '</value>';
								strName					   += '</placeholder>';
							strName					   += '</placeholders>';
						strName					   += '</advisor>';
						strName					   += '<order>';
							strName					   += '<timeStamp>' 			+ EscapeXML(order_timeStamp) 			+ '</timeStamp>';
							strName					   += '<orderID>' 				+ EscapeXML(order_order_id)	 		+ '</orderID>';
							strName					   += '<orderEntryDate>' 		+ EscapeXML(order_order_entry_date) 	+ '</orderEntryDate>';
							strName					   += '<orderStatus>' 			+ EscapeXML(order_order_status) 		+ '</orderStatus>';
							strName					   += '<items>';
								for(var i=1;i<=order_order_items;i++)
								{
									var item 				= returnBlank(salesorder_record.getLineItemValue('item', 'item', i));
									var filters_item		= new Array();
										filters_item.push(new nlobjSearchFilter('internalid',null,'is',item));
									var columns_item		= new Array();
										columns_item.push(new nlobjSearchColumn('custitem_device_type'));
										columns_item.push(new nlobjSearchColumn('custrecord_device_type_allow_device_id','custitem_device_type'));
										columns_item.push(new nlobjSearchColumn('salesdescription'));
									var results_item		= nlapiSearchRecord('item', null, filters_item, columns_item);
									var itemAmount 			= returnBlank(salesorder_record.getLineItemValue('item', 'quantity', i));
									var deviceType 			= returnBlank(results_item[0].getText('custitem_device_type'));
									var allow_device_id 	= returnFalse(results_item[0].getValue('custrecord_device_type_allow_device_id','custitem_device_type'));
									var deviceID1 			= returnBlank(salesorder_record.getLineItemValue('item', 'serialnumbers', i));
									var itemDescription 	= returnBlank(results_item[0].getValue('salesdescription'));
									var itemPrice		 	= returnBlank(salesorder_record.getLineItemValue('item', 'rate', i));
									strName					   += '<item>';
										strName					   += '<itemAmount>'	+ EscapeXML(itemAmount) 	+ '</itemAmount>';
										strName					   += '<devices>';
											strName					   += '<device>';
												strName					   += '<deviceType>' + EscapeXML(deviceType)	+ '</deviceType>';
												if(allow_device_id == 'T')
												{
													strName					   += '<deviceID1>'	 + EscapeXML(deviceID1) 	+ '</deviceID1>';
												}
											strName					   += '</device>';
										strName					   += '</devices>';
										strName					   += '<itemDescription>' 	+ EscapeXML(itemDescription) 	+ '</itemDescription>';
										strName					   += '<itemPrice>' 		+ EscapeXML(itemPrice)			+ '</itemPrice>';
										strName					   += '<itemPromotion>' 	+ "UNDEF" 						+ '</itemPromotion>';;
									strName					   += '</item>';
								}
							strName					   += '</items>';
							strName					   += '<orderTotalPrice>' 	+ EscapeXML(order_order_total_price)	+ '</orderTotalPrice>';
							strName					   += '<orderPromotion>' 	+ "UNDEF"			 					+ '</orderPromotion>';
							strName					   += '<deliveryDate>' 		+ EscapeXML(order_order_delivery_date)	+ '</deliveryDate>';
							strName					   += '<placeholders>';
								strName					   += '<placeholder>';
									strName					   += '<key>'		+ "key1" 	+ '</key>';
									strName					   += '<value>' 	+ "value1" 	+ '</value>';
								strName					   += '</placeholder>';
							strName					   += '</placeholders>';
						strName					   += '</order>';
						strName					   += '<customer>';
							strName					   += '<timeStamp>' 			+ EscapeXML(customer_timeStamp) 	+ '</timeStamp>';
							strName					   += '<customerVrkID>' 		+ EscapeXML(customer_customerID) 	+ '</customerVrkID>';
							strName					   += '<division>' 				+ EscapeXML(customer_division)	 	+ '</division>';
							strName					   += '<firstName>' 			+ EscapeXML(customer_first_name) 	+ '</firstName>';
							strName					   += '<lastName>' 				+ EscapeXML(customer_last_name) 	+ '</lastName>';
							strName					   += '<salutation>'		 	+ EscapeXML(customer_salutation) 	+ '</salutation>';
							strName					   += '<advisor>'			 	+ EscapeXML(customer_advisor)	 	+ '</advisor>';
							strName					   += '<companyName>'			+ EscapeXML(customer_company_name) + '</companyName>';
							strName					   += '<VATNumber>'				+ EscapeXML(customer_vat_number) 	+ '</VATNumber>';
							strName					   += '<optInt>'				+ EscapeXML(customer_opt_in)		+ '</optInt>';
							strName					   += '<addresses>';
								strName					   += '<address>';
									strName					   += '<adresstype>'	+ "BILLING" 								+ '</adresstype>';
									strName					   += '<street>' 		+ EscapeXML(customer_billing_address1) + '</street>';
									strName					   += '<address2>' 		+ EscapeXML(customer_billing_address2) + '</address2>';
									strName					   += '<zipCode>' 		+ EscapeXML(customer_billing_zip)	 	+ '</zipCode>';
									strName					   += '<city>' 			+ EscapeXML(customer_billing_city)		+ '</city>';
									strName					   += '<country>' 		+ "MX" 										+ '</country>';
								strName					   += '</address>';
								strName					   += '<address>';
									strName					   += '<adresstype>'	+ "DELIVERY" 								+ '</adresstype>';
									strName					   += '<street>' 		+ EscapeXML(customer_shiping_address1) + '</street>';
									strName					   += '<address2>' 		+ EscapeXML(customer_shiping_address2) + '</address2>';
									strName					   += '<zipCode>' 		+ EscapeXML(customer_shiping_zip)	 	+ '</zipCode>';
									strName					   += '<city>' 			+ EscapeXML(customer_shiping_city)		+ '</city>';
									strName					   += '<country>' 		+ "MX" + '</country>';
								strName					   += '</address>';
							strName					   += '</addresses>';
							if(customer_mobilephone != '')
							{
								strName					   += '<mobilePhoneNumber>' 	+ EscapeXML(customer_mobilephone) 	+ '</mobilePhoneNumber>';
							}
							strName					   += '<email>' 				+ EscapeXML(customer_email)		+ '</email>';
							strName					   += '<placeholders>';
								strName					   += '<placeholder>';
									strName					   += '<key>'		+ "key1" 	+ '</key>';
									strName					   += '<value>' 	+ "value1" 	+ '</value>';
								strName					   += '</placeholder>';
							strName					   += '</placeholders>';
						strName					   += '</customer>';
					strName					   += '</acquisition>';
                var xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
                	xml += strName;
            	_marcoss_record.setFieldValue('custrecord_marcoss_xml_as_text',xml);
            	_marcoss_record.setFieldValue('custrecord_marcoss_customer',entity);
            	_marcoss_record.setFieldValue('custrecord_marcoss_advisor',salesrep);
            	_marcoss_record.setFieldValue('custrecord_marcoss_acquisition_order_dev',recordId);
            	var id = nlapiSubmitRecord(_marcoss_record);
            	nlapiSubmitField(recordType,recordId,'custbody_marcoss',id);
			}
		}
	}
	catch(e)
	{
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
	  	var author				= -5;
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
function EscapeXML(value)
{
	value	= stringToArray(value,34);//"
	value 	= value.join(' ');
	value	= stringToArray(value,38);//&
	value 	= value.join('AND');
	value	= stringToArray(value,39);//'
	value 	= value.join(' ');
	value	= stringToArray(value,60);//<
	value 	= value.join(' ');
	value	= stringToArray(value,62);//>
	value 	= value.join(' ');
	return value;
}