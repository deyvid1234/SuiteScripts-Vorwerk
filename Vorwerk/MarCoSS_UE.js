function MarCoSS_UE_BeforeLoad(type, form, request)
{
	var Base64		= new MainBase64();
	var recordType	= nlapiGetRecordType();
	var recordId	= nlapiGetRecordId();
	try
	{
		if(type == 'view')
		{
			var _marcoss_xml_as_text	= returnBlank(nlapiGetFieldValue('custrecord_marcoss_xml_as_text'));
			if(_marcoss_xml_as_text != '')
			{
				var urlSUITELET			= nlapiResolveURL("SUITELET", "customscript_marcoss_st_files", "customdeploy_marcoss_st_files", false);
				var data				= new Object();
			    	data.recordType		= recordType;
			    	data.recordId		= recordId;
			    	data.titleForm		= "MarCoSS - XML";
			    	data				= JSON.stringify(data);
			    	data	    		= Base64.encode(data);
		    	var	_marcoss_xml_url	= urlSUITELET 	+ "&data=" 	+ data;
			    	form.addButton("custpage_marcoss_xml", "MarCoSS - XML", "window.open('" + _marcoss_xml_url + "')");
			}
		}
	}
    catch(error)
    {
    	Generic_HE_Catch_SS(error,recordType,recordId);
    }
}
function MarCoSS_UE_AfterSubmit(type)
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
    catch(error)
    {
    	Generic_HE_Catch_SS(error,recordType,recordId);
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