function datosPedimento()
{
    if (request.getMethod() == 'GET')
    {
        var paramenterDataSerials         = request.getParameter('dataSerials');
        //nlapiLogExecution("ERROR", "paramenterDataSerials", paramenterDataSerials);
        var dataSerials                   = stringToArray(paramenterDataSerials,44);
        /*/
        for(var c=0;c<dataSerials.length;c++)
        {
            nlapiLogExecution("ERROR", "dataSerials[" + c + "]", dataSerials[c]);
        }
        /*/
        var description 	= '';
        var filters 		= new Object();
        var columns 		= new Array();
        for(var y=0;y<dataSerials.length;y++)
        {
            filters 				= new nlobjSearchFilter('serialnumber', null, 'is', dataSerials[y]); 
            columns[0] 				= new nlobjSearchColumn('custbody_pedimento');
            columns[1] 				= new nlobjSearchColumn('custbody_fecha_pedimento');
            columns[2] 				= new nlobjSearchColumn('custbody_aduana');
            var pedimento 			= '';
        	var fecha_pedimento 	= '';
        	var aduana 				= '';
            var searchresults 		= returnBlank(nlapiSearchRecord('itemreceipt', null, filters, columns ));
            if(searchresults!='')
            {
            	pedimento 			= returnBlank(searchresults[0].getValue('custbody_pedimento'));
            	fecha_pedimento 	= returnBlank(searchresults[0].getValue('custbody_fecha_pedimento'));
            	aduana 				= returnBlank(searchresults[0].getValue('custbody_aduana'));
                description += dataSerials[y] +' - ' + pedimento + ' - ' + fecha_pedimento + ' - ' + aduana + String.fromCharCode(10);
            }
            else
            {            	
            	description += dataSerials[y] +' - ' + pedimento + ' - ' + fecha_pedimento + ' - ' + aduana + String.fromCharCode(10);
            }
        }
        response.write(description);
    }
}
// --- Helpers ---
//--- 
function getVal(v)
{
    return parseFloat(v) || 0.0;
}
function returnBlank(value)
{   
    if (value == null || value == undefined)
        return '';
    else 
        return value;
}
//helper, convierte las series en un arreglo.
function stringToArray(str,base)
{
     var multiSelectStringArray = str.split(String.fromCharCode(base));
     return multiSelectStringArray;
}
//---
//Regresa un valor 'F' or 'T'
function returnFalse(value)
{   
    if (value == null || value == '')
        return 'F';
    else 
        return value;
}