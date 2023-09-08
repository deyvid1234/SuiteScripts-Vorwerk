/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog','N/http','N/https','N/search'],

function(record,dialog,http,https,search) {
    var info = []
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
    	
    	return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
    	try{
    		var thisRecord = scriptContext.currentRecord;

    		var fieldID = scriptContext.fieldId;
            var fieldValue = thisRecord.getValue(scriptContext.fieldId);

            var fromLocation = thisRecord.getValue('custrecord_from_location');
            var fromLocationEtiqueta = thisRecord.getText('custrecord_from_location');
            console.log('Location',fromLocation)

            var inv_disponible
            var apartadoItem

    		if(fieldID=='custrecord_item_apartado' && fieldValue){
                var itemApartadoEtiqueta = thisRecord.getText('custrecord_item_apartado');
	    		console.log('fieldValue 1',fieldValue)
                var idsKit = []
                var busqueda = search.create({
                    type: 'item',
                    filters: [
                            ['internalid', 'is', fieldValue],
                        ],
                        columns: ['custitem_disponible_eshop','memberitem','type']
                    });
                      
                    busqueda.run().each(function(result){
                        var values = result.getAllValues();
                        console.log('values',values)
                        memberitem = result.getValue('memberitem');
                        idsKit.push(memberitem)
                        type = result.getValue('type');
                        apartadoItem = result.getValue('custitem_disponible_eshop');
                        
                        return true;
                    }); 
                var disponibleParaApartar = 0
                if(type == "Kit"){
                    
                    console.log('Es un kit',idsKit)
                    var busqueda = search.create({
                    type: 'item',
                    filters: [
                                ['type', 'anyof', 'InvtPart', 'Kit', 'NonInvtPart'],
                                'AND',
                                ['inventorylocation.internalidnumber', 'equalto', fromLocation],
                                'AND',
                                ['internalid', 'anyof', idsKit],
                            ],
                        columns: ['locationquantityonhand','custitem_disponible_eshop','internalid','name']
                    });
                    inv_disponible = false
                    var arts = []
                    var pagedResults = busqueda.runPaged();
                        pagedResults.pageRanges.forEach(function (pageRange){
                            var currentPage = pagedResults.fetch({index: pageRange.index});
                            currentPage.data.forEach(function (result) {
                                var values = result.getAllValues();
                                console.log('values search articulos del kit',values)
                                locationquantityonhand = parseInt(result.getValue('locationquantityonhand'));
                                disponibleEshopComponente = parseInt(result.getValue('custitem_disponible_eshop'));

                                var internalidArt = result.getValue('internalid')
                                var nameArtSearch = result.getText('name')

                                if (!disponibleEshopComponente) {
                                    disponibleEshopComponente = 0
                                }
                                disponibleItemComponente = locationquantityonhand-disponibleEshopComponente;
                                var art
                                art.idArt = internalidArt
                                art.nameArt = nameArtSearch
                                art.onHand = locationquantityonhand
                                art.disponibleEshopArticulo = disponibleEshopComponente
                                art.limiteApartadoArt = disponibleItemComponente

                                arts.push(art)

                                console.log('disponibleEshopComponente',disponibleEshopComponente)
                                console.log('locationquantityonhand', locationquantityonhand)
                                console.log('disponibleItemComponente', disponibleItemComponente)

                             var datosApartado = thisRecord.setValue('custrecord_datos_apartado','type ' + type );
                                    /*thisRecord.setValue('custrecord_datos_apartado','Location ' + fromLocation );
                                    thisRecord.setValue('custrecord_datos_apartado','Cantidad Apartada ' + cantidadApartada );
                                    
                                    thisRecord.setValue('custrecord_datos_apartado','Cantidad maxima que se puede apartar ' + cantidadDisponibleField );
                                    */
                                    
                               
                                if(inv_disponible == false ){
                                    inv_disponible = locationquantityonhand
                                }else if(locationquantityonhand < inv_disponible){
                                        inv_disponible = locationquantityonhand
                                }
                                
                                return true;
                            }); 
                    });
                    console.log('inv_disponible',inv_disponible)
                    
                    if(inv_disponible){
                        
                        console.log('apartadoItem',apartadoItem)
                        disponibleParaApartar = inv_disponible-apartadoItem
                        thisRecord.setValue('custrecord_cantidad_disponible', disponibleParaApartar);
                        thisRecord.getField('custrecord_cantidad_apartada').isDisabled = false;
                    }else{
                        thisRecord.setValue('custrecord_cantidad_apartada', '');
                        thisRecord.setValue('custrecord_cantidad_disponible', '');
                        thisRecord.setValue('custrecord_item_apartado', '');
                        var options = {
                            title: 'Sin Inventario',
                            message: 'No hay inventario en 1 o mas items que conforman el kit para el location Origen por lo que no se puede crear un apartado'
                        };
                        dialog.alert(options);
                    }
                    info.articulos = arts
                }else{//Item Regular 
                    var busqueda = search.create({
                        type: 'item',
                        filters: [
                                    ['type', 'anyof', 'InvtPart', 'Kit', 'NonInvtPart'],
                                    'AND',
                                    ['inventorylocation.internalidnumber', 'equalto', fromLocation],
                                    'AND',
                                    ['internalid', 'anyof', fieldValue],
                                ],
                        columns: ['locationquantityonhand','custitem_disponible_eshop']
                    });
                      
                    var pagedResults = busqueda.runPaged();
                        pagedResults.pageRanges.forEach(function (pageRange){
                            var currentPage = pagedResults.fetch({index: pageRange.index});
                            currentPage.data.forEach(function (result) {
                                
                                inv_disponible = result.getValue('locationquantityonhand');
                                apartadoItem = result.getValue('custitem_disponible_eshop');
                            }); 
                    });
                    console.log('Tienes disponible: '+inv_disponible)
                    if(inv_disponible){
                        
                        console.log('apartadoItem',apartadoItem)
                        disponibleParaApartar = inv_disponible-apartadoItem
                        thisRecord.setValue('custrecord_cantidad_disponible', disponibleParaApartar);
                        thisRecord.getField('custrecord_cantidad_apartada').isDisabled = false;
                    }else{
                        thisRecord.setValue('custrecord_cantidad_apartada', '');
                        thisRecord.setValue('custrecord_cantidad_disponible', '');
                        thisRecord.setValue('custrecord_item_apartado', '');
                        var options = {
                            title: 'Sin Inventario',
                            message: 'No hay inventario en el location Origen por lo que no se puede crear un apartado'
                        };
                        dialog.alert(options);
                    }
                }

                info.item = fieldValue
                info.location = fromLocation
                info.cantidadDisponible = disponibleParaApartar
                info.itemApartadoEtiqueta = itemApartadoEtiqueta
                info.locationEtiqueta = fromLocationEtiqueta

                
                
                console.log('info item ingresado',info)
                

    		}

            if(fieldID=='custrecord_cantidad_apartada' && fieldValue){

                var cantidadApartada = thisRecord.getValue('custrecord_cantidad_apartada');
                console.log('cantidadApartada', cantidadApartada)

                var cantidadDisponibleField = thisRecord.getValue('custrecord_cantidad_disponible');
                console.log('cantidadDisponibleField',cantidadDisponibleField)

               

                if(fieldValue > cantidadDisponibleField){

                    thisRecord.setValue('custrecord_cantidad_apartada', '');
                    var options = {
                        title: 'Error',
                        message: 'No puede apartar mas de la cantidad disponible en el location Seleccionado'
                    };
                    dialog.alert(options);
                }
                info.cantidadApartada = fieldValue
                console.log('info cantidad apartada',info)
            }
    		
    	}catch(err){
    		log.error("error fieldChanged",err);
    	}
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDelete(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(xde) {
    	try{
            var type = xde.mode
            console.log('type',type)
            var currentRecord = xde.currentRecord;
            if(type == 'create' || true){
                thisRecord.setValue('custrecord_datos_apartado','Test Json' );
            }
    	   
    	}catch(err){
    		log.error('error saverecord',err);
    	}
    	return true;
    }

   
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
//        postSourcing: postSourcing,
//        sublistChanged: sublistChanged,
//        lineInit: lineInit,
//        validateField: validateField,
//        validateLine: validateLine,
//        validateInsert: validateInsert,
//        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
    
});
