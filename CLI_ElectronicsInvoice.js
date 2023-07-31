// BEGIN SCRIPT DESCRIPTION BLOCK  ==================================
{
/*
   	Script Name:
	Author:   Mangesh
	Company:  ProquestSolutions
	Date:     5 nov 2011
	Version:  1.1
	Description:to call web service on button click.


	Script Modification Log:

	-- Date --			-- Modified By --				--Requested By--				-- Description --
      5-11-2011            Mangesh                         Sachin                       On page init disabled 5 fields  



	Below is a summary of the process controls enforced by this script file.  The control logic is described
	more fully, below, in the appropriate function headers and code blocks.

     PAGE INIT
		- pageInit(type)


     SAVE RECORD
		- saveRecord()


     VALIDATE FIELD
		- validateField(type, name, linenum)


     FIELD CHANGED
		- fieldChanged(type, name, linenum)


     POST SOURCING
		- postSourcing(type, name)


	LINE INIT
		- lineInit(type)


     VALIDATE LINE
		- validateLine()


     RECALC
		- reCalc()


     SUB-FUNCTIONS
		- The following sub-functions are called by the above core functions in order to maintain code
            modularization:





*/
}
// END SCRIPT DESCRIPTION BLOCK  ====================================



// BEGIN SCRIPT UPDATION BLOCK  ====================================
/*


*/
// END SCRIPT UPDATION BLOCK  ====================================


// BEGIN GLOBAL VARIABLE BLOCK  =====================================
{

	//  Initialize any Global Variables, in particular, debugging variables...
}
// END GLOBAL VARIABLE BLOCK  =======================================





function pageInitPS(type)
{
	
	           // if(type=='edit')
				{
					nlapiDisableField('custbody_codigo_retorno',true);
					nlapiDisableField('custbody_mensaje_retorno',true);
					nlapiDisableField('custbody_pdf_file',true);
					nlapiDisableField('custbody_xml_cfdipro_file',true);
					nlapiDisableField('custbody_xml_file',true);
					
				}
}