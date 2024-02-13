//Utils v2
define(['N/record', 'N/search','N/runtime','N/format','N/query'],

function(record, search, runtime, format, query) {
    
    function getLog(scriptName){
        log.debug('llamado correcto de utils',scriptName)
    }


    function getObjCompConfigDetails(){
        var objCompensationConfig = this.getCompensationConfig();
        log.debug('objCompensationConfig',objCompensationConfig)
        var objWithVentasPresentadora = this.getEsquemaVentasPresentadora(objCompensationConfig);
        var objWithVentasJefaPropias = this.getEsquemaVentasJefaPropias(objWithVentasPresentadora);
        var objWithVentasJefaGrupo = this.getEsquemaVentasJefaGrupo(objWithVentasJefaPropias);
        var objWithVentasTrabajaXTM = this.getEsquemaVentasTrabajaXTM(objWithVentasJefaGrupo);
        var objWithVentasReclutamiento = this.getEsquemaVentasReclutamiento(objWithVentasTrabajaXTM);

        return objWithVentasReclutamiento
    }

    //Inicio dateToString
    // Recive un new date y devuelve un texto con formato dd/mm/yyyy
    function dateToString(fecha){//Se espera "2023-09-30T07:00:00.000Z"
        // Verificar si la entrada es un objeto Date
        if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
            log.error('La fecha proporcionada no es válida.');
            return null; 
        }

        // Obtener los componentes de la fecha
        const dia = fecha.getDate().toString();
        const mes = (fecha.getMonth() + 1).toString(); // Se suma 1 porque los meses van de 0 a 11
        const ano = fecha.getFullYear();

        // Construir la cadena en formato dd/mm/yyyy
        const fechaFormateada = dia+'/'+mes+'/'+ano;

        return fechaFormateada;
    }
    //Fin dateToString 
    function stringToDate(fechaString) {
        // Verificar si la cadena de fecha es nula o indefinida
        fechaString = fechaString.toString();
        if (!fechaString) {
            log.error('La cadena de fecha proporcionada es nula o indefinida.');
            return null; 
        }

        // Detectar el formato de la cadena de fecha
        var partesFecha;
        if (fechaString.indexOf('/') || fechaString.indexOf('-')) {
            partesFecha = fechaString.split(/\/|-/); // Utilizar una expresión regular para admitir ambos separadores
        } else {
            log.error('Formato de fecha no compatible. Use dd/mm/yyyy o yyyy/mm/dd.');
            return null;
        }
        // Verificar si el formato es yyyy/mm/dd o dd/mm/yyyy
        var ano, mes, dia;
        if (partesFecha[0].length === 4) {
            ano = partesFecha[0];
            mes = partesFecha[1];
            dia = partesFecha[2];
        } else {
            ano = partesFecha[2];
            mes = partesFecha[1];
            dia = partesFecha[0];
        }

        // Convertir a formato de fecha yyyy/mm/dd
        var fecha = new Date(ano+'/'+mes+'/'+dia);

        // Verificar si la fecha es válida
        if (isNaN(fecha.getTime())) {
            log.error('La fecha proporcionada no es válida.');
            return null;
        }

        // Clonar la fecha para evitar modificar la fecha original
        const nuevaFecha = new Date(fecha);


        return nuevaFecha;
    }
    function restarMeses(fechaString, cantidadMeses) {
        
        const nuevaFecha = stringToDate(fechaString)
        
        // Restar la cantidad de meses
        nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidadMeses);

        return nuevaFecha;
    }

    return {
        getLog: getLog,
        dateToString:dateToString,
        stringToDate:stringToDate,
        restarMeses:restarMeses,
        getObjCompConfigDetails:getObjCompConfigDetails,
    };
});