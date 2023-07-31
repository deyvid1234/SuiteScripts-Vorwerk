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
function pushArrayValue(array,value)
{
    var l = array.length;
    var a = new Array();
    var c =0;
    for(var i=0;i<l;i++)
    {
        a[i] = array[i];
    }
    a.push(value);
    return a;
}
//---
function popArrayValue(array,value)
{
    var l = array.length;
    var a = new Array();
    var c =0;
    for(var i=0;i<l;i++)
    {
        if(value != array[i])
        {
            a[c] = array[i];
            c++;
        }
    }
    return a;
}
//---
function returnArray(value)
{   
    if (value == null || value == '')
        return new Array;
    else 
        return value;
}
//---
function returnFalse(value)
{   
    if (value == null || value == '')
        return 'F';
    else 
        return value;
}
//--
function deleteDuplicateElements(value)
{
    var lon = value.length;
    var i =0;
    var resultados = new Array();
    for(var cont=lon-1;cont>0;cont--)
    {
        if(value[cont]!=value[cont-1])
         { resultados[i]=value[cont]; i++; }              
    }
    resultados[i]=value[0]
    resultados.reverse();
    return resultados;
}