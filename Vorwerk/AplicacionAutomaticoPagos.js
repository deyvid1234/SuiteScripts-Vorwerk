function afterSubmit(type)
{
    try
    {
        if(type != 'delete')
        {
            var recordType  = nlapiGetRecordType();
            var recordId    = nlapiGetRecordId();
            var invoiceRec  = nlapiLoadRecord(recordType,recordId);
            var customer    = returnBlank(invoiceRec.getFieldValue('entity'));
            var createdfrom = returnBlank(invoiceRec.getFieldValue('createdfrom'));
            var amtremaning = getVal(invoiceRec.getFieldValue('amountremaining'));
            var amtpayment  = getVal(invoiceRec.getFieldValue('amountpaid'));
            var total       = getVal(invoiceRec.getFieldValue('total'));
            //nlapiLogExecution('DEBUG','amtpayment',amtpayment);
            //nlapiLogExecution('DEBUG','total',total);
            if(amtpayment < total)
            {
                //nlapiLogExecution('DEBUG','createdfrom',createdfrom);
                if(createdfrom != '')
                {
                    var filters     = new Array();
                        filters[0]  = new nlobjSearchFilter('custbody_transaccion_realacionada',null,'is',createdfrom);
                        filters[1]  = new nlobjSearchFilter('mainline',null,'is','T');
                        filters[2]  = new nlobjSearchFilter('custbody_importe_no_aplicado',null,'greaterthan',0);
                    var columns     = new Array();
                    var payments    = returnBlank(nlapiSearchRecord('customerpayment',null,filters,columns))
                    if(payments != '')
                    {
                        var numresults      = payments.length;
                        //nlapiLogExecution('DEBUG','numresults',numresults);
                        for(var n=0;n<numresults;n++)
                        {
                            var payment         = nlapiLoadRecord(payments[n].getRecordType(),payments[n].getId());
                            var account         = payment.getFieldValue('account');
                                payment.setFieldValue('customer',customer);
                                payment.setFieldValue('account',account);
                            nlapiSubmitRecord(payment);
                            var payment         = nlapiLoadRecord(payments[n].getRecordType(),payments[n].getId());
                            var lines           = payment.getLineItemCount('apply');
                            var amountpayment   = getVal(payment.getFieldValue('payment'));
                            for(var i=1;i<=lines;i++)
                            {
                                var doc     = payment.getLineItemValue('apply','doc',i);
                                var due     = getVal(payment.getLineItemValue('apply','due',i));
                                var amount  = 0;
                                var documentacion = ''
                                if(doc == recordId)
                                {
                                    //nlapiLogExecution('DEBUG','doc == recordId',doc == recordId);
                                    if(due <= amountpayment)
                                    {
                                        amount = due;
                                    }
                                    else
                                    {
                                        amount = amountpayment;
                                    }
                                    payment.setFieldValue('autoapply','F');
                                    payment.setLineItemValue('apply','apply',i,'T');
                                    payment.setLineItemValue('apply','amount',i,amount);
                                    break;
                                }
                            }
                            nlapiSubmitRecord(payment);
                            payment         = nlapiLoadRecord(payments[n].getRecordType(),payments[n].getId());
                            var impAp = getVal(payment.getFieldValue('applied'));
                            var impNA = getVal(payment.getFieldValue('unapplied'));
                            payment.setFieldValue('custbody_importe_no_aplicado',impNA);
                            payment.setFieldValue('custbody_importe_aplicado',impAp);
                            nlapiSubmitRecord(payment);
                            nlapiLogExecution('DEBUG','nlapiSubmitRecord','nlapiSubmitRecord');
                        }
                    } 
                }
            }
        }
    }
    catch(e)
    {
        if ( e instanceof nlobjError )
        {
            nlapiLogExecution( 'DEBUG', 'system error', e.getCode() + '\n' + e.getDetails() );
        }
        else
        {
            nlapiLogExecution( 'DEBUG', 'unexpected error', e.toString() );
        }        
    }
}
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