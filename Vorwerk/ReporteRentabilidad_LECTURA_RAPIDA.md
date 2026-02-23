# Reporte de Rentabilidad – Lectura rápida y contexto para desarrollo

Guía para entender el código en poco tiempo y seguir desarrollando el módulo en otro chat o más adelante.

---

## Archivos

| Archivo | Líneas aprox. | Contenido principal |
|---------|----------------|----------------------|
| **ReporteRentabilidadSuitelet.js** | ~3078 | Todo: filtros, búsquedas, caches, cálculos, HTML, form, guardado para export. |
| **ReporteRentabilidadExportSuitelet.js** | ~232 | CSV: cabeceras, formateo de filas, recepción fileId/data, descarga. |

---

## Flujo en 4 pasos

1. **onRequest** (aprox. 137–161)  
   - GET → showFilterForm. POST → showReport.

2. **showReport** (aprox. 1880–1940)  
   - Params → filters. Carga caches (comisión, gerentes, descuento proveedor). getAccount5100Id(). executeInvoiceSearch(filters). calculateExcelFormulas por fila. buildReportHTMLPaginated o formulario. Opcional saveReportDataToTempFile.

3. **executeInvoiceSearch** (aprox. 485–1060)  
   - Búsqueda facturas (CustInvc) + búsqueda NC (CustCred). Precarga EPAs por SO, impacto 5100 EPAs; para NC: RAs, Item Receipts (ItemRcpt), impacto 5100 IRs. Recorre facturas → por ítem busca EPA con costo para ese ítem. Recorre NC → costo desde IR 5100 (negativo). Devuelve array de objetos fila.

4. **calculateExcelFormulas** (aprox. 1450–1575)  
   - Recalcula transporte, costo total, utilidad, USD, Ingreso Casa, % comisión por margen, Comisión, comisiones por gerente, utilidad después de comisiones, % margen final.

---

## Dónde está cada cosa

### Búsquedas y filtros

- **Facturas**: `executeInvoiceSearch` → `invoiceSearchFilters`, `invoiceSearch` (transaction, type CustInvc). Columnas: internalid, trandate, item, amount, quantity, createdfrom, custbody_kop_costotransporte (join createdfrom), etc.
- **NC**: `buildCreditMemoSearchFilters`, `buildCreditMemoSearchColumns` (transaction, type CustCred). Filtro opcional `internalid` = creditMemoId.
- **Item Fulfillment**: `preloadFulfillmentsBySalesOrders(soIds)` → search type transaction, type SalesOrdFulfillment, createdfrom anyof soIds. Cache: `fulfillmentsBySOCache[soId] = [{ id, tranid }, ...]`.
- **Impacto 5100 fulfillment**: `preloadFulfillmentAccountingImpact(account5100Id)` → posting search por fulfillment, account 5100, mainline F. Cache: `fulfillmentImpactCache[fulfillmentId] = { byItem: { itemId: amount }, total }`.
- **Item Receipt desde RA**: `preloadItemReceiptsByReturnAuths(raIds)` → search type transaction, type **ItemRcpt**, createdfrom anyof raIds. Cache: `raToItemReceiptCache[raId] = { id, tranid }`.
- **Impacto 5100 Item Receipt**: `preloadItemReceiptAccountingImpact(irIds, account5100Id)`. Cache: `itemReceiptImpactCache[irId] = { byItem, total }`.
- **Cuenta 5100**: `getAccount5100Id()` → search account number 5100. Cache: `account5100IdCache`.

### Caches globales (por request)

- `descuentoProveedorCache` – loadDescuentoProveedorCache.
- `comisionParamsCache` – loadComisionParams (customrecord_parametros_comision).
- `comisionesGerentesCache` – loadComisionesGerentesCache (employee, custentity_comision_*).
- `fulfillmentsBySOCache`, `fulfillmentImpactCache`, `raToItemReceiptCache`, `itemReceiptImpactCache` – en executeInvoiceSearch se inicializan y usan las preloads.

### Fórmulas (origen de los cálculos)

- **Transporte** = cantidad × costoTransporteCreated (este viene de la OV).
- **Nota Crédito Proveedor** = tipoCambio × cantidad × factorDescuento (factor desde customrecord_descuento_proveedor si artículo en lista + cliente + proveedor + vigencia).
- **Costo Total** = COSTO + Transporte − Nota Crédito Proveedor.
- **Utilidad Bruta** = Importe − Costo Total.
- **Margen MN** = Utilidad Bruta / Importe (si Importe > 0).
- **Ingreso USD, Costo USD, etc.** = monto / tipoCambio.
- **Ingreso Casa** = Ingreso USD × tipoCambioInterno (parámetro del reporte).
- **% Comisión (por margen)** = lookup en customrecord_parametros_comision por rango (margen mínimo–máximo); ver getComisionPorMargen (aprox. 1796–1810).
- **Comisión** = (porcentaje comisión en decimal) × Ingreso Casa.
- **Comisión por gerente** = (porcentaje gerente / 100) × Ingreso Casa (porcentajes en Employee).
- **Utilidad después de comisiones de gerencia** = Utilidad Bruta − Comisión total gerentes.
- **% Margen (final)** = Utilidad después de comisiones de gerencia / Ingreso.

### Costo por tipo de documento

- **Factura**: por cada línea se obtienen fulfillments de la OV (createdfrom); se recorre cada EPA y se usa el primero con getFulfillmentAccountingImpactByItem(epaId, itemId, 5100) > 0. Ese costo y ese EPA (tranid) se asignan a la fila.
- **Nota de crédito**: NC → createdfrom = RA; RA → Item Receipt (ItemRcpt) por createdfrom; costo = impacto 5100 del IR por ítem, en **negativo** (costoIr ? -(Math.abs(costoIr)) : 0).

---

## Constantes y configuración

- **ReporteRentabilidadSuitelet.js**: EXPORT_SUITELET_SCRIPT_ID, EXPORT_SUITELET_DEPLOY_ID (aprox. 60–61). EXPORT_JSON_CHUNK_SIZE (aprox. 71). MAX_PAGES_VIEW (aprox. 632) para limitar páginas en vista.
- **ReporteRentabilidadExportSuitelet.js**: CSV_HEADERS (10–19). EXPORT_FOLDER_ID (79). EXPORT_BASE_URL (81).

---

## Añadir o cambiar columnas

1. En **ReporteRentabilidadSuitelet.js**: donde se arma el objeto fila (facturas ~779–824, NC ~919–956), añadir la propiedad. Si el valor se calcula después, añadirlo en **calculateExcelFormulas**. En **buildReportHTMLPaginated** (aprox. 1968–1980) añadir la clave en el array de columnas (k, l, g). En el formulario serverWidget (aprox. 2195–2300) añadir la columna en la tabla si aplica.
2. En **ReporteRentabilidadExportSuitelet.js**: añadir el nombre en **CSV_HEADERS** y el valor en **rowToCsvValues(row)** en el mismo orden.

---

## Descuento proveedor (multi-select)

- **custrecord_dp_articulo** es multi-select. En loadDescuentoProveedorCache se guarda como array `articulos` (getValue puede devolver array o string con comas; se normaliza a array). En getFactorDescuentoProveedor se usa `articulos.indexOf(articuloId) !== -1` para saber si el artículo aplica.

---

## Notas de crédito y filtro por ID

- Si el usuario informa “ID Factura / Nota de Crédito”, se usa como creditMemoId para filtrar NC (buildCreditMemoSearchFilters). Además, al recorrer resultados de NC se omite toda fila donde ncId !== creditMemoId (filtro en memoria). Tipo de transacción para Item Receipt en NetSuite es **ItemRcpt** (con p), no ItemRct.

---

## Logs útiles para depurar

- showReport params tipo= invoice_id= creditMemoId=  
- Paso 1a Search Facturas / Paso 1b Search NC / NC resultados internalids= tranids=  
- Paso 1b RAs únicos= / Paso 1c Item Receipt / Paso 1c diagnóstico (transacciones con createdfrom=RA sin filtro type)  
- Paso 1c RAs con Item Receipt= / IR ids para impacto= / Paso 1d IRs con impacto 5100=  
- ReporteRentabilidad Tiempos (JSON con total_ms y pasos)

---

## Resumen para otro chat / tiempo posterior

- **Módulo**: Reporte de rentabilidad por línea (facturas y NC). Costo desde cuenta 5100 (EPA para facturas, Item Receipt para NC). Transporte, descuento proveedor, utilidad, margen, comisiones por gerente (Employee) y por margen (Custom Record). Export a CSV vía segundo Suitelet.
- **Archivos**: ReporteRentabilidadSuitelet.js (lógica y vista), ReporteRentabilidadExportSuitelet.js (solo CSV).
- **Entrada**: Filtros (fechas, tipo, cliente, artículo, ID documento, etc.). Salida: tabla por línea + export CSV.
- **Puntos sensibles**: cuenta 5100 debe existir; tipo Item Receipt = ItemRcpt; varias EPAs por OV → costo por ítem desde el EPA que tenga ese ítem; NC → costo negativo desde IR 5100; descuento proveedor con artículo multi-select (array articulos).
