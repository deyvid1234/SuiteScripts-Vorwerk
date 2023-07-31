//Elimina los valores nulos. 
function returnBlank(value)
{	
	if (value == null)
		return '';
	else 
		return value;
}
function getVal(v)
{
	return parseFloat(v) || 0.0;
}
//funcion que agrega el boton al formulario.
function ButtonCrearEmpleado(type, form)
{
	if (type == 'view' && nlapiGetFieldValue('isperson')=='T')
	{	
		var TranId  	= nlapiGetRecordId();
		var TranType 	= nlapiGetRecordType();
		var url 	= nlapiResolveURL('SUITELET', 'customscript_crear_empleado_record', 'customdeploy_crear_empleado_record');
			url 	= url + "&custparam_TranType=" + TranType+"&custparam_TranId=" + TranId;
		form.addButton("custpage_btnprint", "Crear Presendatora", "window.open('"+url+"')");
	}
}
//Funcion que genera el registro del empleado
function CrearEmpleadoRecord(request, response)
{		
	var TranId	 		= request.getParameter('custparam_TranId');
	var TranType 		= request.getParameter('custparam_TranType');
	var cliente  		= nlapiLoadRecord(TranType, TranId);
	var firstname		= returnBlank(cliente.getFieldValue('firstname'));
	var lastname		= returnBlank(cliente.getFieldValue('lastname'));
	var nombreCompleto  = returnBlank(cliente.getFieldValue('entityid'));
	var rfc 			= returnBlank(cliente.getFieldValue('vatregnumber'));
	var email 			= returnBlank(cliente.getFieldValue('email'));
	var Etiqueta = new String(), Attention= new String() , Addressee= new String() , Phone= new String() , Address1= new String() , Address2= new String() , City= new String(), CountyStateProvince= new String(), postalCode= new String(), Country  = new String();
	for(var i=1;i<=cliente.getLineItemCount('addressbook');i++)
	{
		if(cliente.getLineItemValue('addressbook','defaultshipping',i)=='T')
		{
			Etiqueta 			= returnBlank(cliente.getLineItemValue('addressbook','label',i));
			Attention 			= returnBlank(cliente.getLineItemValue('addressbook','attention',i));
			Addressee 			= returnBlank(cliente.getLineItemValue('addressbook','addressee',i));
			Phone 				= returnBlank(cliente.getLineItemValue('addressbook','phone',i));
			Address1 			= returnBlank(cliente.getLineItemValue('addressbook','addr1',i));
			Address2 			= returnBlank(cliente.getLineItemValue('addressbook','addr1',i));
			City 				= returnBlank(cliente.getLineItemValue('addressbook','city',i));
			CountyStateProvince = returnBlank(cliente.getLineItemValue('addressbook','state',i));
			postalCode 			= returnBlank(cliente.getLineItemValue('addressbook','zip',i));
			Country 			= returnBlank(cliente.getLineItemValue('addressbook','country',i));
		}
	}
	if(TranType=='lead')
	{ 
		try
		{ 
			nlapiSubmitField('lead',TranId,'entitystatus',19);
		}
		catch(e)
		{
			if ( e instanceof nlobjError )
				nlapiLogExecution('ERROR', 'system error', e.getCode() + '\n' + e.getDetails() );
			else
				nlapiLogExecution('ERROR', 'unexpected error', e.toString() );
		} 
	}
	var newEmployee = nlapiCreateRecord("employee");
	newEmployee.setFieldValue('autoname','T');
	newEmployee.setFieldValue('firstname',firstname);
	newEmployee.setFieldValue('lastname',lastname);
	newEmployee.setFieldValue('entityid',nombreCompleto);
	newEmployee.setFieldValue('custentity_ce_rfc',rfc);
	newEmployee.setFieldValue('email',email);
	newEmployee.setLineItemValue('addressbook','defaultshipping',1,'T');
	newEmployee.setLineItemValue('addressbook','label',1,Etiqueta);
	newEmployee.setLineItemValue('addressbook','attention',1,Attention);
	newEmployee.setLineItemValue('addressbook','addressee',1,Addressee);
	newEmployee.setLineItemValue('addressbook','phone',1,Phone);
	newEmployee.setLineItemValue('addressbook','addr1',1,Address1);
	newEmployee.setLineItemValue('addressbook','addr1',1,Address2);
	newEmployee.setLineItemValue('addressbook','city',1,City);
	newEmployee.setLineItemValue('addressbook','state',1,CountyStateProvince);
	newEmployee.setLineItemValue('addressbook','zip',1,postalCode);
	newEmployee.setLineItemValue('addressbook','country',1,Country);
	var newEmployeeId = nlapiSubmitRecord(newEmployee);
	nlapiSetRedirectURL('RECORD','employee',newEmployeeId, false);
}