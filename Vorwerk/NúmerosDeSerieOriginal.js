function NumerosDeSerieOriginal_FieldChanged(type,name,linenum)
{
	try
	{
		if(type == 'item')
		{
			if(name == 'custcol_numeros_serie_original')
			{
				var serialnumbers			= new Array();
				var _numeros_serie_original = returnBlank(nlapiGetCurrentLineItemValue('item', 'custcol_numeros_serie_original'));
				if(_numeros_serie_original != '')
				{
					var recordType	= nlapiGetRecordType();
					if(recordType == 'salesorder')
					{
						_numeros_serie_original = stringToArray(_numeros_serie_original, 10);
						for(var i=0;i<_numeros_serie_original.length;i++)
						{
							var serie = _numeros_serie_original[i].substring(0,17);
							serialnumbers.push(serie);
						}
					}
					else
					{
						var _qr_scans			= stringToArray(_numeros_serie_original, 124);
						for(var h=0;h<_qr_scans.length;h++)
						{
							_numeros_serie_original = stringToArray(_qr_scans[h], 59);
							//var pedimento			= _numeros_serie_original[0];
							//var articuloAlemania	= _numeros_serie_original[1];
							var cantidadSeries		= _numeros_serie_original[2];
							for(var i=1;i<=cantidadSeries;i++)
							{
								var serie = _numeros_serie_original[(i+2)].substring(0,17);
								serialnumbers.push(serie);
							}
						}
					}
					nlapiSetCurrentLineItemValues('item', 'serialnumbers', serialnumbers, true, true);
				}
			}
		}
	}
    catch(e)
    {
    	Generic_HE_Catch_CT(e);
    }
}