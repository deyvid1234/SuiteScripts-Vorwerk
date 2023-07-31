function beforeLoad(type, form)
{
    if(type=='view')
    {
        form.addTab('custpage_tab_integrantes', 'Integrantes');
        var detalleIntegrantesSublist = form.addSubList('custpage_detalle_integrantes', 'inlineeditor', 'Integrantes','custpage_tab_integrantes');
            detalleIntegrantesSublist.setDisplayType('normal');  
            detalleIntegrantesSublist.addField('custpage_det_num_linea', 'integer', '#');
            detalleIntegrantesSublist.addField('custpage_det_integrante', 'select', 'Integrante','employee');
            detalleIntegrantesSublist.addField('custpage_det_delegacion', 'select', 'Delegación','customlist9');
            detalleIntegrantesSublist.addField('custpage_det_jefa_grupo', 'select', 'Jefa de Grupo','employee');
            detalleIntegrantesSublist.addField('custpage_det_sucursal', 'select', 'Sucursal','location');
            detalleIntegrantesSublist.addField('custpage_det_delegada', 'select', 'Delegada','employee');
        var custrecord_jefa_grupo   = nlapiGetFieldValue('custrecord_jefa_grupo');
        var custrecord_delegacion   = nlapiGetFieldValue('custrecord_delegacion');
        var custrecord_sucursal     = nlapiGetFieldValue('custrecord_sucursal');
        var custrecord_delegada     = nlapiGetFieldValue('custrecord_delegada');
        var name                    = nlapiGetFieldValue('name');
        var filters = new Array();
            filters[0] = new nlobjSearchFilter('custentity_nombre_unidad',null, 'is', name);
            /*/
            filters[1] = new nlobjSearchFilter('supervisor',null, 'is', custrecord_jefa_grupo);
            filters[2] = new nlobjSearchFilter('custentity_delegacion',null, 'is', custrecord_delegacion);
            filters[3] = new nlobjSearchFilter('location',null, 'is', custrecord_sucursal);
            filters[4] = new nlobjSearchFilter('custentity_delegada',null, 'is', custrecord_delegada);
            /*/
        var columns = new Array();
            columns[0] = new nlobjSearchColumn('supervisor')
            columns[1] = new nlobjSearchColumn('custentity_delegacion');
            columns[2] = new nlobjSearchColumn('location');
            columns[3] = new nlobjSearchColumn('custentity_delegada');
        var integrantes = returnBlank(nlapiSearchRecord('employee', null, filters, columns));
        if(integrantes != '')
        {
            for(var i=0;i<integrantes.length;i++)
            {
                var lineNumber = new Number(i + 1);
                detalleIntegrantesSublist.setLineItemValue('custpage_det_num_linea', i+1, lineNumber.toString());
                detalleIntegrantesSublist.setLineItemValue('custpage_det_integrante', i+1, integrantes[i].getId());
                detalleIntegrantesSublist.setLineItemValue('custpage_det_delegacion', i+1, integrantes[i].getValue('custentity_delegacion'));
                detalleIntegrantesSublist.setLineItemValue('custpage_det_jefa_grupo', i+1, integrantes[i].getValue('supervisor'));
                detalleIntegrantesSublist.setLineItemValue('custpage_det_sucursal', i+1, integrantes[i].getValue('location'));
                detalleIntegrantesSublist.setLineItemValue('custpage_det_delegada', i+1, integrantes[i].getValue('custentity_delegada'));
            }
        }
    }
    //var context = nlapiGetContext();
    //nlapiLogExecution('DEBUG', 'Remaining usage', context.getRemainingUsage());
}