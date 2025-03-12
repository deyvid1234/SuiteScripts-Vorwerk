/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord'],
    function(currentRecord) {

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} context
     * @param {CurrentRecord} context.currentRecord - Current form record
     * @param {string} context.sublistId - Sublist name
     * @param {string} context.fieldId - Field name
     * @param {number} context.line - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} context.column - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(context) {
        if (context.fieldId === 'custpage_process') {
            console.log('context', context);
            var currentRec = context.currentRecord;
            var process = currentRec.getValue({
                fieldId: 'custpage_process'
            });
            console.log('process', process);
            var searchField = currentRec.getField({
                fieldId: 'custpage_searchid'
            });
            console.log('searchField', searchField);
            if (process == '1') {
                searchField.isDisabled = false;
                searchField.isMandatory = true;
            } else {
                searchField.isDisabled = true;
                searchField.isMandatory = false;
                currentRec.setValue({
                    fieldId: 'custpage_searchid',
                    value: ''
                });
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});