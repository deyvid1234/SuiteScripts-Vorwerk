/*
************************************
Script desarrollados para IMR
3Ksys - Buenos Aires - Argentina
************************************
*/
 
 
 /**
  * Is Null or Empty.
  * 
  * @param {Object} strVal
  */
function isNullorEmpty(strVal)
{
	return (strVal == null || strVal == '');
}


function in_array (needle, haystack, argStrict)
{
    // Checks if the given value exists in the array
    //
    // version: 911.718
    // discuss at: http://phpjs.org/functions/in_array    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: vlado houba
    // +   input by: Billy
    // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: in_array('van', ['Kevin', 'van', 'Zonneveld']);    // *     returns 1: true
    // *     example 2: in_array('vlado', {0: 'Kevin', vlado: 'van', 1: 'Zonneveld'});
    // *     returns 2: false
    // *     example 3: in_array(1, ['1', '2', '3']);
    // *     returns 3: true    // *     example 3: in_array(1, ['1', '2', '3'], false);
    // *     returns 3: true
    // *     example 4: in_array(1, ['1', '2', '3'], true);
    // *     returns 4: false
    var key = '', strict = !!argStrict;
    if (strict)
	{
        for (key in haystack)
		{
            if (haystack[key] === needle)
			{
                return true;
			}
        }
    }
	else
	{
        for (key in haystack)
		{
            if (haystack[key] == needle)
			{
				return true;
            }
        }
    }
    return false;
}


function date_weekday(indice)
{
	weekday[0]="Sunday";
	weekday[1]="Monday";
	weekday[2]="Tuesday";
	weekday[3]="Wednesday";
	weekday[4]="Thursday";
	weekday[5]="Friday";
	weekday[6]="Saturday";
	
	return weekday[indice];
}


function es_feriado(fecha)
{		
	var filters	= new Array();
	var columns	= new Array();
	
	filters[0]	= new nlobjSearchFilter('custrecord_fecha_feriado', null, 'on', fecha);
	
	var searchresults 	= new nlapiSearchRecord("customrecord_dias_feriados", null, filters, columns );	
	
	if (searchresults.length == 0 || searchresults.length == null)
		return false;
	else
		return true;
}

function es_fin_de_semana(indice)
{	
	return (indice == 0 || indice == 1);
}

function es_dia_habil(fecha)
{
	return !(es_feriado(nlapiDateToString(fecha)) || es_fin_de_semana(fecha.getDay()));
}