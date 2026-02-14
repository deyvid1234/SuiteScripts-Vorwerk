/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'],
    function(record, search, runtime, log) {

        /**
         * Obtiene los datos de entrada para el proceso Map/Reduce
         * @return {Object} búsqueda guardada o array de objetos
         */
        function getInputData() {
            try {
                // Array con los internal IDs y UUIDs de las facturas a procesar
                // Formato: {id: ID, uuid: UUID}
                var invoiceData = [
                    
                    { id: 7419066, uuid: 'f891bad0-80b9-4df5-8ee9-877b17fbd16e' },
                    { id: 7419067, uuid: 'c8897cc9-ff1c-49d1-abd6-5a7c95abc22c' },
                    { id: 7419107, uuid: '53c54049-61e1-4941-8e13-e2d0567cfce8' },
                    { id: 7419108, uuid: '29000465-d7c3-40f0-b51f-8a15977c9283' },
                    { id: 7419109, uuid: '249625eb-4871-4a65-ae25-73285c43e9a4' },
                    { id: 7419110, uuid: '8423961d-9d91-4a9f-8e24-c767b887b035' },
                    { id: 7419111, uuid: 'eee82805-bb82-4683-bd11-8319e2ed86cd' },
                    { id: 7419112, uuid: 'c2c6743e-51f6-4fab-ae0d-797c5cb5f3ac' },
                    { id: 7419113, uuid: '1e8d6275-7418-4204-8003-007b983789c7' },
                    { id: 7419115, uuid: '933c1a04-923c-4291-a040-29c31c6ccfa5' },
                    { id: 7419116, uuid: '12aa1291-1c33-4fcc-8636-f6cd6ba94408' },
                    { id: 7419137, uuid: '66f2e445-af0d-4359-881c-57353944257e' },
                    { id: 7419139, uuid: 'e017c80c-5d02-46c1-a3e6-8d60dbe86af8' },
                    { id: 7419141, uuid: 'c3ccb8ed-30aa-4c90-9453-e9d7e1a9cecd' },
                    { id: 7419142, uuid: '62dde720-7797-49a2-924d-56a269072728' },
                    { id: 7419143, uuid: 'ffd6848c-1378-4938-afc2-7bc3916b5149' },
                    { id: 7419145, uuid: 'd0c068a4-583c-4fc4-9522-25bc23adbee4' },
                    { id: 7419147, uuid: '7910bdff-8fdb-49f4-975b-181c2a08261a' },
                    { id: 7419148, uuid: '68b4fc02-7bf7-44b3-bc2b-2cf22446347c' },
                    { id: 7419150, uuid: '60e773e8-c9b3-4392-b3e9-b9aa01eeff8c' },
                    { id: 7419151, uuid: '6cdacff4-2bc4-4b3b-8dc9-db7a875610f1' },
                    { id: 7419153, uuid: '9931e0b5-2b54-4a78-930b-45c8ad3e96d8' },
                    { id: 7419154, uuid: 'f3588098-8a86-4856-849c-ca38e01e5aa9' },
                    { id: 7419156, uuid: 'd0325b47-40f1-45dd-908e-f545db85a69f' },
                    { id: 7419159, uuid: 'd7a9dc6f-2c88-442c-b571-bc4613ac06a0' },
                    { id: 7419161, uuid: 'f909d92c-826e-4c1a-b3cf-9042910ceefc' },
                    { id: 7419472, uuid: '755e87a1-99d2-4547-9ae8-83fe99cb5225' },
                    { id: 7419475, uuid: 'cc46c9fe-f526-48f8-9f0b-b0f52b56652f' },
                    { id: 7419479, uuid: 'c6d87e36-5945-4a52-9346-59082887bc48' },
                    { id: 7419480, uuid: '08e2a702-5c07-4d49-ad36-30b150464fa1' },
                    { id: 7419484, uuid: '426d1a0e-b7f1-4bdb-bf29-d2c3e7a3fbd9' },
                    { id: 7419486, uuid: '802fc84b-c1c3-4696-acde-b7d80cdcd65e' },
                    { id: 7419489, uuid: 'f6473d30-4d16-44f6-864e-ae23586f692d' },
                    { id: 7419490, uuid: '6763f3b8-fb11-4da2-bee5-e389e2abc004' },
                    { id: 7419491, uuid: 'a5a0cc67-7cab-4bf9-b681-76ca6eacef9c' },
                    { id: 7419493, uuid: 'fb957149-70e1-448b-8ae0-89b39ee33696' },
                    { id: 7419495, uuid: '8c9ef564-efee-4b13-a814-0bec251885d7' },
                    { id: 7419496, uuid: '4ed69793-b253-4a73-a28c-9efaa07f901b' },
                    { id: 7419497, uuid: '2aa3a39f-3b03-412b-b582-fba591b4f36c' },
                    { id: 7419500, uuid: 'f8c5c3af-0b38-4066-8592-b57b5d844e52' },
                    { id: 7419501, uuid: 'cffcb39a-023d-4bb5-a2e1-082008c5bac8' },
                    { id: 7419503, uuid: 'e1ef7fcb-242f-44f6-9021-1f94c21ba927' },
                    { id: 7419504, uuid: 'ddb93fe5-6c4c-4464-9dbb-6326e1c451e3' },
                    { id: 7419506, uuid: 'a22fd730-528f-4525-9d12-378a73596d5e' },
                    { id: 7419508, uuid: '593ed850-e69f-450f-8e3a-06be2e75f11b' },
                    { id: 7419512, uuid: 'f0e5b1f4-50b3-47df-ae8e-5dcd45c61e15' },
                    { id: 7419514, uuid: 'c551019d-2b9c-427e-8dbb-5578c324f068' },
                    { id: 7419515, uuid: '87ac52fe-e33a-4021-b815-fffeb35f8bcf' },
                    { id: 7419516, uuid: '13bcb3d0-26e9-4e40-bd7b-0263f51edf45' },
                    { id: 7419517, uuid: '8a70f690-859e-4e70-855b-54f91e053e2e' },
                    { id: 7419518, uuid: '39cc5e25-1c88-4c58-a4b2-6d3322dc696a' },
                    { id: 7419520, uuid: '36139649-6abf-4954-9c83-8356c3ba8bf7' },
                    { id: 7419521, uuid: 'fafb8265-3324-4013-bcbf-20f82ae904a8' },
                    { id: 7420355, uuid: '0b883c8e-5271-4192-9594-12e72068a2c1' },
                    { id: 7421741, uuid: '62f8880e-c509-411e-8bc6-d77e3b05077f' },
                    { id: 7421747, uuid: '7db5727a-1a66-47fc-b378-f8506c71157b' },
                    { id: 7421748, uuid: '697bd302-2e33-4df8-9dd9-a2312e8cb23a' },
                    { id: 7421750, uuid: 'eb2cbd07-9bc0-464a-91f5-56f214672a88' },
                    { id: 7421751, uuid: 'e8949324-5346-4ec8-bca5-a0521e8a6d69' },
                    { id: 7421754, uuid: 'e28a8120-5f45-418a-a629-39af01682b84' },
                    { id: 7421756, uuid: 'c15b3465-be5e-4bfa-bd86-a78192f8cbd5' },
                    { id: 7421758, uuid: 'dc8d3672-f974-4229-8253-087bbe1ead84' },
                    { id: 7421759, uuid: '53135ba4-752f-48b8-8867-209d16ce4295' },
                    { id: 7421760, uuid: '9f0232be-d7a3-4d53-9d65-d71e414730ba' },
                    { id: 7421761, uuid: 'a354ea68-9f55-46c9-a894-2d1db6414131' },
                    { id: 7421762, uuid: 'dd753ff9-7076-448b-8a13-8faf2769e42e' },
                    { id: 7421763, uuid: '1becd588-2b2c-490d-a783-bbee55b5b894' },
                    { id: 7421764, uuid: '9e588ad3-00c7-4d19-9675-afee0335ff04' },
                    { id: 7421767, uuid: 'd4efe6db-604a-4423-a865-2ab966894322' },
                    { id: 7421768, uuid: 'e3298b3b-c7a9-42a5-b782-10be4e23a538' },
                    { id: 7421769, uuid: '8c0c5618-0515-498d-9cfc-192e088d8bd4' },
                    { id: 7421770, uuid: '10ca195a-9b3e-443d-b743-a900e74e42a7' },
                    { id: 7421772, uuid: '61046a80-7bb9-4d99-bbf9-f0a6b06c035d' },
                    { id: 7421774, uuid: '2a34e4fb-1746-4674-9a2a-c2f85e3246d7' },
                    { id: 7421775, uuid: '8d115aa4-85ae-477c-8ed8-1ace5cbdb1cd' },
                    { id: 7422339, uuid: 'b1f1f483-b644-44a5-a4e0-330cf794518f' },
                    { id: 7422344, uuid: '702c486b-0a26-4b96-84e6-5228d6c083e2' },
                    { id: 7422347, uuid: '6502788b-0581-4faf-aadb-d295caab9be8' },
                    { id: 7422349, uuid: '1b6675a7-e2d9-444a-bcc6-a12e18ad5441' },
                    { id: 7422352, uuid: '4c37f398-a687-4ec2-b856-115ca6926d97' },
                    { id: 7422353, uuid: 'd3572e61-73b8-4ba0-9b48-7a42605414f5' },
                    { id: 7422354, uuid: 'e5c214dc-f026-4fd4-8449-b7ba88dae710' },
                    { id: 7422356, uuid: '624d01ef-8d2c-4ca7-a804-988d4fc76b92' },
                    { id: 7422357, uuid: '6c277a8c-41af-4749-85c4-0ee076973ee1' },
                    { id: 7422358, uuid: 'ebefd55b-b7a0-4056-aa4b-31599d082ea6' },
                    { id: 7422360, uuid: '1cb40501-d05c-476b-a460-8e4ee00eb7fb' },
                    { id: 7422361, uuid: '83b3eeac-d493-4a71-b268-e8dd0515bb1a' },
                    { id: 7422364, uuid: 'cb7b0e90-595c-4814-82aa-68d5b2682468' },
                    { id: 7422367, uuid: '6edd85d2-18dd-4024-83c6-bf616664d22e' },
                    { id: 7422369, uuid: '8b1dc25a-70fb-4e4c-95e6-7dcc6e7e8bfa' },
                    { id: 7422370, uuid: '149beec9-8c94-41af-898a-d3aae7c822b0' },
                    { id: 7422373, uuid: '7c94ea2a-88c9-4dc0-bd14-22a31cbc0b42' },
                    { id: 7422374, uuid: 'c385b68c-8ab6-4596-99a4-295807d4d30d' },
                    { id: 7422375, uuid: 'e4725058-6c96-4288-bd1a-e3d04eb2f729' },
                    { id: 7422376, uuid: 'c8edc0ae-f91f-42bf-8d3a-22b0fab09698' },
                    { id: 7423310, uuid: 'b88f8eca-9fb2-4590-9074-82df0c0f275d' },
                    { id: 7423312, uuid: '264e3ba7-3968-4383-93f8-7f981d08a04e' },
                    { id: 7423313, uuid: '59f4e8fe-f1db-4fdc-8453-5f97a337b8eb' },
                    { id: 7423314, uuid: 'fa2524a5-19bc-4690-b8c3-4d735b02544a' },
                    { id: 7423315, uuid: 'd40e8b35-cede-4719-b770-87e252ccdb8e' },
                    { id: 7423317, uuid: '9bc593db-34ee-40c1-ba79-bbcbbc305f8b' },
                    { id: 7423323, uuid: '4d314273-e99c-48fe-8fa0-92bfc8ab97a2' },
                    { id: 7423324, uuid: '2a0b8bb7-4821-4b83-b401-0d9075d79b76' },
                    { id: 7423327, uuid: '6bff5dc9-50d5-4657-945d-cb95ccf6246e' },
                    { id: 7423328, uuid: '691ffc16-64e2-4d14-871d-d1bd995d9e7f' },
                    { id: 7423329, uuid: 'cae7ef7c-38ae-40bf-9737-b3581ddb8a2d' },
                    { id: 7423330, uuid: '951f8058-0e1b-4037-98c9-558e888fef01' },
                    { id: 7423331, uuid: '1d307d4d-d033-49a4-84b9-bd9987c9e43e' },
                    { id: 7423332, uuid: '7920d5b9-d6f2-4288-b015-702cf619de49' },
                    { id: 7423333, uuid: '5e4a336a-7cfe-4e5a-922c-8e2ceeb56f52' },
                    { id: 7423334, uuid: '45e4f429-0d13-4937-88c8-73f681c0501f' },
                    { id: 7423335, uuid: 'f0e02a49-b455-4c6a-b5f8-04a138e7e3f8' },
                    { id: 7423336, uuid: '7e7b0840-fbb5-48a5-90d5-b1e4436f29c0' },
                    { id: 7423337, uuid: '946a6bfc-4098-4fb8-86f5-97b7aab68a00' },
                    { id: 7423338, uuid: '2c8140dd-be31-4b54-82b2-997b32539084' },
                    { id: 7423339, uuid: 'b7d7fd47-1c04-4624-9eec-07e9099189b0' },
                    { id: 7423340, uuid: '680b367a-c094-4708-8213-b7acfccf5abf' },
                    { id: 7423341, uuid: '3caaa6a1-0e6e-4468-b4e4-e44b9eb23d14' },
                    { id: 7423342, uuid: '7564391e-4c24-4def-b42c-954ff83b6bc1' },
                    { id: 7423343, uuid: '5a1885df-ed50-4509-9ba3-32e9110b5559' },
                    { id: 7423344, uuid: '15ea1d89-6c9f-458d-a3af-e2223e17b024' },
                    { id: 7423345, uuid: '34747cef-406d-42f5-a482-a033ce80b350' },
                    { id: 7423346, uuid: '1019aa9c-b8ef-41a6-8661-a0e7b7929516' },
                    { id: 7423348, uuid: 'f6fd686b-d88d-48f8-b3ae-b3ff83eb7f3f' },
                    { id: 7423349, uuid: 'b8211cf6-ac46-41ae-b753-06440511ccda' },
                    { id: 7423350, uuid: '3249db42-dbf8-445e-a9db-a3b50d2f25a9' },
                    { id: 7423353, uuid: 'ef3a9562-e13d-4e48-8530-83a20c325c86' },
                    { id: 7423355, uuid: 'c0431040-4e2b-4353-b8c2-14afeab5f3bd' },
                    { id: 7423356, uuid: '7888bde6-adff-441b-8fa0-f75a2ae70a75' },
                    { id: 7423357, uuid: '08999ee5-0a4c-4ce6-953b-90a74135b062' },
                    { id: 7423358, uuid: '5056cc17-8bb3-4684-9235-7658f5179d55' },
                    { id: 7423359, uuid: 'c88f8415-f64c-4262-bd54-c3150645e329' },
                    { id: 7423360, uuid: '2d770cb9-f18b-46e0-8c8a-726c86ef0a13' },
                    { id: 7423361, uuid: 'cd981585-a59b-479f-bd0b-4b0c451d07be' },
                    { id: 7423362, uuid: 'a23d8352-c8b7-4f87-9ed3-5647c484a729' },
                    { id: 7423363, uuid: 'e8d7a6d2-e3e6-4716-90e3-a2fd01ff3d24' },
                    { id: 7423364, uuid: 'cf18d4cf-80a8-4270-a94d-4d262190bf0d' },
                    { id: 7423368, uuid: 'ee67a2de-9958-4bef-aa32-7d2490169828' },
                    { id: 7423369, uuid: '76de6f80-e869-40fc-80d8-2b1f14a11326' },
                    { id: 7423371, uuid: '7db9ceac-8d96-4f8a-987e-ca4c184a2f8a' },
                    { id: 7423372, uuid: 'd7d37043-d357-464b-b78b-dddec2036687' },
                    { id: 7423373, uuid: '1be4ce50-8539-4550-8ad3-b762dc5a8dd5' },
                    { id: 7423375, uuid: '151d5bd7-303b-4dc2-8226-4797a5c06ac3' },
                    { id: 7423377, uuid: '254a1261-ad50-445a-8597-2507ebc80768' },
                    { id: 7423379, uuid: 'dbc64678-3ecf-48e0-a849-bf88516a065a' },
                    { id: 7423380, uuid: 'ad924637-4b42-40fe-9807-ff6cc2e2f715' },
                    { id: 7423381, uuid: '93d7832d-3bdc-4b92-af5f-b7b343a6f5d0' },
                    { id: 7423383, uuid: '3eb72c62-1739-444a-8ef6-a7132121fdb7' },
                    { id: 7423385, uuid: 'a0047eb2-6730-4d14-8fb2-b6422c21e7a1' },
                    { id: 7423386, uuid: '9e709a19-731f-4a0c-8e24-703de36604ad' },
                    { id: 7423387, uuid: '9190ad42-8080-4089-af22-dc8df7207e91' },
                    { id: 7423388, uuid: 'feb924b3-2293-4208-9a47-40ef59388b9e' },
                    { id: 7423389, uuid: '03e9ba6e-33a8-4049-810e-ce4435c91322' },
                    { id: 7423391, uuid: '47c97371-4dc6-40c2-8fe6-53c84d551c0a' },
                    { id: 7423392, uuid: '60e4386f-b9e2-48e3-a177-005a2e91524a' },
                    { id: 7423395, uuid: '4f6c7e3b-9a82-4026-abee-48de95996c57' },
                    { id: 7423396, uuid: 'e89a58aa-1d07-4f58-bd84-4016ed972d84' },
                    { id: 7423397, uuid: '9ad5fa9c-cdb5-4f9c-a453-2d8d4bd8ec93' },
                    { id: 7423398, uuid: '6d5ab060-9caf-4b66-bdd0-762a8dc68c94' },
                    { id: 7423399, uuid: '542d814f-0ffe-4fcb-9665-3c3c2ff66e3d' },
                    { id: 7423400, uuid: '4e1fa8d2-c61f-455e-b488-bbe85f690659' },
                    { id: 7423401, uuid: '366573bc-9ebf-408d-ab8f-ee86a820302a' },
                    { id: 7423408, uuid: '31af8358-2a70-4e17-a34b-2929292e899d' },
                    { id: 7423409, uuid: '6ac1ff20-d048-452f-bb68-94f1a8d38442' },
                    { id: 7423412, uuid: '8e0c6f3c-2ba1-429d-bd41-96d562d4f5fd' },
                    { id: 7423415, uuid: '4082997d-aa2b-4bd7-bf7a-db9a7d1c3c69' },
                    { id: 7423420, uuid: '170c8802-544f-4eed-af8b-f997b6a9399a' },
                    { id: 7459369, uuid: 'd5f96c6c-4b42-42a9-826f-48e7ecbf7743' }
                ];

                // Crear array de objetos para el Map/Reduce
                var inputArray = invoiceData.map(function(invoice) {
                    return {
                        id: invoice.id,
                        uuid: invoice.uuid
                    };
                });

                return inputArray;
            } catch (e) {
                log.error({
                    title: 'Error en getInputData',
                    details: e.toString()
                });
            }
        }

        /**
         * Procesa cada registro de factura
         * @param {Object} context
         */
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);
                var invoiceId = searchResult.id;
                // Obtener el UUID del input data en lugar de la factura
                var custbodyUuid = searchResult.uuid || null;

                log.audit({
                    title: 'Procesando Invoice',
                    details: 'Invoice ID: ' + invoiceId + ' | UUID: ' + (custbodyUuid || 'No proporcionado')
                });

                // Cargar el registro de la factura
                var invoiceRecord = record.load({
                    type: record.Type.INVOICE,
                    id: invoiceId,
                    isDynamic: false
                });

                // Obtener el valor del campo custbody37
                var custbody37 = invoiceRecord.getValue({
                    fieldId: 'custbody37'
                });
                var facturaTranid = invoiceRecord.getValue({
                    fieldId: 'tranid'
                });
                // Verificar si la invoice ya fue procesada (custbody82)
                var custbody82 = invoiceRecord.getValue({
                    fieldId: 'custbody_anticipo_aplicado'
                });

                log.debug({
                    title: 'Campos obtenidos',
                    details: 'custbody_uuid: ' + custbodyUuid + ' | custbody37: ' + custbody37 + ' | custbody82: ' + custbody82
                });

                // Si custbody82 es true, la invoice ya fue procesada
                if (custbody82 === true) {
                    log.audit({
                        title: 'Invoice ya procesada',
                        details: 'Invoice ID: ' + invoiceId + ' ya fue procesada anteriormente (custbody82 = true)'
                    });
                    return; // Pasar al siguiente resultado
                }

                // Buscar sales order con tranid igual a custbody37
                var salesOrderSearch = search.create({
                    type: search.Type.SALES_ORDER,
                    filters: [
                        ['tranid', 'is', custbody37],
                        'AND',
                        ['mainline', 'is', true]
                    ],
                    columns: [
                        'internalid',
                        'status',
                        'custbody_tipo_venta'
                    ]
                });

                var salesOrderResults = salesOrderSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                // Verificar si existe la sales order y su status
                if (salesOrderResults.length === 0) {
                    log.audit({
                        title: 'Sales Order no encontrada',
                        details: 'No se encontró sales order con tranid: ' + custbody37 + ' para invoice: ' + invoiceId
                    });
                    return; // Pasar al siguiente resultado
                }

                var salesOrderStatus = salesOrderResults[0].getValue({
                    name: 'status'
                });
                var custbody_tipo_venta = salesOrderResults[0].getValue({
                    name: 'custbody_tipo_venta'
                });
                log.debug('custbody_tipo_venta',custbody_tipo_venta)
                log.debug({
                    title: 'Sales Order encontrada',
                    details: 'Sales Order ID: ' + salesOrderResults[0].id + ' | Status: ' + salesOrderStatus
                });

                // Verificar que el status sea 'Pending Billing'
               /* if (salesOrderStatus !== 'pendingBilling' ) {
                    log.audit({
                        title: 'Sales Order no está en F',
                        details: 'Sales Order tranid: ' + custbody37 + ' tiene status: ' + salesOrderStatus + ' (se requiere F)'
                    });
                    return; // Pasar al siguiente resultado
                }
                log.audit({
                    title: 'Condición cumplida',
                    details: 'Sales Order tranid: ' + custbody37 + ' está en F, procediendo con credit memo'
                });*/
                if (custbody_tipo_venta != 2) {
                    log.audit({
                        title: 'Sales Order no permite credit memo',
                        details: 'Sales Order tranid: ' + custbody37 + ' tiene custbody_tipo_venta: ' + custbody_tipo_venta + ' (se requiere 2)'
                    });
                    return; // Pasar al siguiente resultado
                }

                log.audit({
                    title: 'Condiciones cumplidas',
                    details: 'Sales Order tranid: ' + custbody37 + ' está en F y custbody_tipo_venta es "ventas tm", procediendo con credit memo'
                });

                

                // Transformar la factura a credit memo
                var creditMemo = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: invoiceId,
                    toType: record.Type.CREDIT_MEMO,
                    isDynamic: false
                });

                // Recorrer las líneas del credit memo para identificar items a cambiar
                var lineCount = creditMemo.getLineCount({
                    sublistId: 'item'
                });

                // Array para guardar las líneas que necesitan cambio
                var linesToChange = [];

                for (var i = 0; i < lineCount; i++) {
                    var currentItem = creditMemo.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    // Si el item es 2803, guardamos los datos de esta línea
                    if (currentItem == 2803) {
                        log.debug({
                            title: 'Línea encontrada',
                            details: 'Línea ' + i + ' - Item 2803 será cambiado a 2824'
                        });

                        // Obtener todos los valores actuales de la línea
                        var lineData = {
                            lineNumber: i,
                            quantity: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i
                            }),
                            units: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'units',
                                line: i
                            }),
                            location: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                line: i
                            }),
                            
                            rate: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i
                            }),
                            amount: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'amount',
                                line: i
                            }),
                            taxCode: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'taxcode',
                                line: i
                            }),
                            priceLevel: creditMemo.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'price',
                                line: i
                            })
                        };

                        linesToChange.push(lineData);
                    }
                }

                // Remover las líneas en orden inverso para no afectar los índices
                for (var j = linesToChange.length - 1; j >= 0; j--) {
                    var lineToRemove = linesToChange[j].lineNumber;
                    
                    log.debug({
                        title: 'Removiendo línea',
                        details: 'Línea ' + lineToRemove
                    });

                    creditMemo.removeLine({
                        sublistId: 'item',
                        line: lineToRemove
                    });
                }

                // Agregar las nuevas líneas con el item 2402 al final
                for (var k = 0; k < linesToChange.length; k++) {
                    var lineData = linesToChange[k];
                    
                    // Obtener el nuevo índice (al final de las líneas existentes)
                    var newLineIndex = creditMemo.getLineCount({
                        sublistId: 'item'
                    });

                    log.debug({
                        title: 'Agregando nueva línea',
                        details: 'Índice: ' + newLineIndex + ' - Item 2402'
                    });

                    // Insertar una nueva línea
                    creditMemo.insertLine({
                        sublistId: 'item',
                        line: newLineIndex
                    });

                    // Establecer el nuevo item
                    creditMemo.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: newLineIndex,
                        value: 2824
                    });

                    // Establecer todos los valores
                    if (lineData.quantity) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: newLineIndex,
                            value: lineData.quantity
                        });
                    }

                    if (lineData.location) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            line: newLineIndex,
                            value: lineData.location
                        });
                    }

                    if (lineData.description) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: newLineIndex,
                            value: 'APLICACIÖN DE ANTICIPO'
                        });
                    }

                    if (lineData.rate) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: newLineIndex,
                            value: lineData.rate
                        });
                    }

                    if (lineData.taxCode) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: newLineIndex,
                            value: lineData.taxCode
                        });
                    }

                    if (lineData.priceLevel) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            line: newLineIndex,
                            value: lineData.priceLevel
                        });
                    }

                    if (lineData.amount) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: newLineIndex,
                            value: lineData.amount
                        });
                    }

                    if (lineData.units) {
                        creditMemo.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: newLineIndex,
                            value: lineData.units
                        });
                    }
                }
                creditMemo.setValue({
                    fieldId: 'otherrefnum',
                    value: custbody37
                });
                creditMemo.setValue({
                    fieldId: 'memo',
                    value: 'NC - FACTURA '+ facturaTranid
                });
                log.debug('test memo', 'NC - FACTURA '+ facturaTranid)
                // Establecer los campos CFDI en el credit memo
                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_metpago_sat',
                    value: 918
                });

                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_formadepago',
                    value: 1
                });

                creditMemo.setValue({
                    fieldId: 'custbody_uso_cfdi',
                    value: 2
                });

                creditMemo.setValue({
                    fieldId: 'custbody_cfdi_tipode_relacion',
                    value: 7
                });

                log.debug({
                    title: 'Campos CFDI establecidos',
                    details: 'custbody_cfdi_metpago_sat: 917, custbody_cfdi_formadepago: 1, custbody_uso_cfdi: 2, custbody_cfdi_tipode_relacion: 7'
                });

                // Guardar el credit memo
                var creditMemoId = creditMemo.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.audit({
                    title: 'Credit Memo creado',
                    details: 'Invoice ID: ' + invoiceId + ' | Credit Memo ID: ' + creditMemoId + ' | UUID: ' + custbodyUuid
                });

                // Marcar custbody82 como true para indicar que la invoice ya fue procesada
                if(creditMemoId){
                    try {
                        record.submitFields({
                            type: record.Type.INVOICE,
                            id: invoiceId,
                            values: {
                                custbody_anticipo_aplicado: true
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
    
                        log.audit({
                            title: 'Invoice marcada como procesada',
                            details: 'Invoice ID: ' + invoiceId + ' - custbody_anticipo_aplicado marcado como true'
                        });
                    } catch (e) {
                        log.error({
                            title: 'Error al marcar invoice como procesada',
                            details: 'Invoice ID: ' + invoiceId + ' | Error: ' + e.toString()
                        });
                    }
    
                }
                
                // Crear el registro de relación CFDI
                var cfdiRelacionRecord = record.create({
                    type: 'customrecord_cfdis_relacion',
                    isDynamic: false
                });

                // Establecer los campos del registro
                cfdiRelacionRecord.setValue({
                    fieldId: 'custrecord_cfdi_tabla_padre',
                    value: creditMemoId
                });

                cfdiRelacionRecord.setValue({
                    fieldId: 'custrecord_cfdi_rel_tran',
                    value: invoiceId
                });

                if (custbodyUuid) {
                    cfdiRelacionRecord.setValue({
                        fieldId: 'custrecord_cfdi_rel_uuid',
                        value: custbodyUuid
                    });
                }

                // Guardar el registro de relación
                var cfdiRelacionId = cfdiRelacionRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                });

                log.audit({
                    title: 'Registro CFDI Relación creado',
                    details: 'CFDI Relación ID: ' + cfdiRelacionId + ' | Credit Memo ID: ' + creditMemoId + ' | Invoice ID: ' + invoiceId + ' | UUID: ' + custbodyUuid
                });

                // Enviar los datos al reduce
                context.write({
                    key: invoiceId,
                    value: {
                        creditMemoId: creditMemoId,
                        custbodyUuid: custbodyUuid,
                        cfdiRelacionId: cfdiRelacionId
                    }
                });

            } catch (e) {
                log.error({
                    title: 'Error en map',
                    details: 'Error procesando invoice: ' + context.value + ' | Error: ' + e.toString()
                });
            }
        }

        /**
         * Consolida los resultados
         * @param {Object} context
         */
        function reduce(context) {
            try {
                var invoiceId = context.key;
                var values = context.values;

                log.audit({
                    title: 'Reduce - Resumen',
                    details: 'Invoice ID: ' + invoiceId + ' | Valores: ' + JSON.stringify(values)
                });

                // Escribir información para el summarize
                context.write({
                    key: 'processed_invoices',
                    value: {
                        invoiceId: invoiceId,
                        creditMemoId: values[0] ? values[0].creditMemoId : null,
                        custbodyUuid: values[0] ? values[0].custbodyUuid : null
                    }
                });

            } catch (e) {
                log.error({
                    title: 'Error en reduce',
                    details: e.toString()
                });
            }
        }

        /**
         * Resume final del proceso
         * @param {Object} summary
         */
        function summarize(summary) {
            var totalProcessed = summary.inputSummary ? summary.inputSummary.count : 0;
            var mapErrors = summary.mapSummary ? summary.mapSummary.errors : null;
            var reduceErrors = summary.reduceSummary ? summary.reduceSummary.errors : null;
            
            // Obtener información de las invoices procesadas desde reduce
            var processedInvoices = [];
            var totalInvoicesProcessed = 0;
            
            if (summary.reduceSummary && summary.reduceSummary.results) {
                summary.reduceSummary.results.iterator().each(function(key, value) {
                    if (key === 'processed_invoices') {
                        var invoiceData = JSON.parse(value);
                        if (invoiceData && invoiceData.invoiceId) {
                            processedInvoices.push(invoiceData);
                            totalInvoicesProcessed++;
                        }
                    }
                    return true;
                });
            }
            
            log.audit({
                title: 'Resumen del proceso',
                details: 'Total de registros de entrada: ' + (totalProcessed || 0) + ' | Total de invoices procesadas exitosamente: ' + totalInvoicesProcessed
            });

            // Mostrar lista de invoices procesadas
            if (processedInvoices.length > 0) {
                var invoiceList = processedInvoices.map(function(invoice) {
                    return 'Invoice ID: ' + invoice.invoiceId + 
                           (invoice.creditMemoId ? ' | Credit Memo ID: ' + invoice.creditMemoId : '') +
                           (invoice.custbodyUuid ? ' | UUID: ' + invoice.custbodyUuid : '');
                }).join('\n');
                
                log.audit({
                    title: 'Invoices procesadas exitosamente',
                    details: 'Lista de invoices procesadas:\n' + invoiceList
                });
            } else {
                log.audit({
                    title: 'Invoices procesadas',
                    details: 'No se procesaron invoices exitosamente'
                });
            }

            // Registrar errores si los hay
            if (mapErrors && mapErrors.iterator) {
                mapErrors.iterator().each(function(key, error) {
                    log.error({
                        title: 'Error en Map',
                        details: 'Key: ' + key + ' | Error: ' + error
                    });
                    return true;
                });
            }

            if (reduceErrors && reduceErrors.iterator) {
                reduceErrors.iterator().each(function(key, error) {
                    log.error({
                        title: 'Error en Reduce',
                        details: 'Key: ' + key + ' | Error: ' + error
                    });
                    return true;
                });
            }

            log.audit({
                title: 'Proceso completado',
                details: 'Script finalizado exitosamente - Total invoices procesadas: ' + totalInvoicesProcessed + ' de ' + (totalProcessed || 0) + ' registros de entrada'
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });

