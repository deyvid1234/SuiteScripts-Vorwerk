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
    function restarMeses(fechaString, cantidadMeses) {
        
        const nuevaFecha = stringToDate(fechaString)
        
        // Restar la cantidad de meses
        nuevaFecha.setMonth(nuevaFecha.getMonth() - cantidadMeses);

        return nuevaFecha;
    }

    return {
        getLog: getLog,
        dateToString:dateToString,

        getObjCompConfigDetails:getObjCompConfigDetails,
    };
});