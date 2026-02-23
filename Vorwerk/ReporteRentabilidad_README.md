# Reporte de Rentabilidad – Documentación general

## 1. Propósito del módulo

Suitelet en NetSuite (SuiteScript 2.x) que genera un **reporte de rentabilidad** por línea de factura y de nota de crédito. Para cada línea calcula:

- **Costo** (desde Item Fulfillment / Item Receipt, cuenta 5100)
- **Transporte**, **Nota Crédito Proveedor** (descuento simulado)
- **Utilidad bruta**, **margen**, conversiones a **USD** e **Ingreso Casa**
- **Comisiones por gerente** (desde Employee) y **comisión por margen** (desde Custom Record)
- **Utilidad después de comisiones de gerencia** y **% Margen** final

El reporte se muestra en pantalla (HTML o formulario NetSuite) y se puede exportar a **CSV** mediante un segundo Suitelet que solo formatea datos ya calculados.

---

## 2. Archivos del módulo

| Archivo | Rol |
|--------|-----|
| **ReporteRentabilidadSuitelet.js** | Lógica principal: filtros, búsquedas, cálculos, vista HTML/form y guardado de datos para export. |
| **ReporteRentabilidadExportSuitelet.js** | Recibe datos (JSON o `fileId`) y genera CSV para descarga. No ejecuta búsquedas ni cálculos. |
| **ReporteRentabilidad_README.md** | Esta documentación general. |
| **ReporteRentabilidad_LECTURA_RAPIDA.md** | Guía de lectura rápida y contexto para seguir desarrollando. |

---

## 3. Flujo de ejecución (alto nivel)

1. **onRequest**  
   - GET sin params → formulario de filtros (serverWidget).  
   - POST → **showReport** (genera reporte).

2. **showReport**  
   - Lee parámetros (fechas, tipo, cliente, artículo, ID factura/NC, etc.).  
   - Carga caches: parámetros de comisión, comisiones gerentes (Employee), descuento proveedor.  
   - Obtiene ID cuenta **5100** (Materia Prima).  
   - Llama **executeInvoiceSearch(filters, maxRows, startPage)** → devuelve array de filas.  
   - Aplica **calculateExcelFormulas** a cada fila (comisiones por margen, Ingreso Casa, etc.).  
   - Según vista: guarda datos en archivo temporal (para export) o no.  
   - Responde: HTML paginado, formulario con tabla, o redirección a export.

3. **executeInvoiceSearch**  
   - Búsqueda de **Facturas** (CustInvc) con filtros.  
   - Búsqueda de **Notas de Crédito** (CustCred) con los mismos filtros (+ opcional `creditMemoId`).  
   - Precarga: **Item Fulfillments** por Sales Order, **impacto 5100** de fulfillments; para NC: **Return Auth** desde NC, **Item Receipt** desde RA (tipo **ItemRcpt**), impacto 5100 de IR.  
   - Por cada línea de factura: asocia **todas** las EPAs de la OV y toma el costo del EPA que tiene impacto 5100 para **ese ítem**.  
   - Por cada línea de NC: costo = impacto 5100 del Item Receipt (por ítem), con **signo negativo**.  
   - Arma cada fila (campos de documento, costo, transporte, nota crédito proveedor, utilidad, margen, comisiones gerentes, etc.) sin llamar aún a `calculateExcelFormulas`.

4. **calculateExcelFormulas(row)**  
   - Normaliza nombres (importe, cantidad, tipoCambio, costo).  
   - Recalcula transporte, costo total, utilidad bruta, USD, Ingreso Casa.  
   - Obtiene **% comisión por margen** (customrecord_parametros_comision).  
   - Calcula **Comisión** = % comisión × Ingreso Casa.  
   - Calcula comisiones por gerente (ROSARIO, ALHELY, etc.) y utilidad después de comisiones de gerencia.

---

## 4. Origen de los datos y cálculos

### 4.1 Transacciones base

- **Facturas**: tipo `CustInvc`, búsqueda por fecha, período, clase, ubicación, cliente, representante, artículo.  
  - `createdfrom` = Sales Order.  
  - Una OV puede tener **varias facturas** y **varias ejecuciones (EPA)**; el costo se busca por **ítem** en el EPA que tenga impacto 5100 para ese ítem.

- **Notas de crédito**: tipo `CustCred`, mismos filtros + opcional filtro por internalid de NC.  
  - Relación: **NC → createdfrom = Return Authorization → Item Receipt** (tipo `ItemRcpt`).  
  - Costo NC = impacto en cuenta **5100** del Item Receipt por ítem, con **signo negativo**.

### 4.2 Costo (COSTO)

- **Facturas**: cuenta contable **5100** (Materia Prima).  
  - Se resuelve la cuenta por `account.number = 5100`.  
  - Búsqueda de **posting** (`transaction`) con `internalid` = fulfillment, `account` = 5100, `mainline = F`; se agrupa por `item` → `byItem[itemId]`.  
  - Por línea de factura se usa el fulfillment (EPA) cuya `byItem[articuloId]` sea > 0 (puede haber varios EPAs por OV).

- **Notas de crédito**: misma cuenta 5100, pero sobre el **Item Receipt** ligado a la Return Authorization de la NC.  
  - Búsqueda de transacciones tipo **ItemRcpt** con `createdfrom` = RA.  
  - Posting del IR con cuenta 5100, desglose por ítem; ese monto se asigna a la línea de NC y se guarda en **negativo**.

### 4.3 Transporte

- **Cantidad × Costo transporte por unidad**.  
- Costo transporte por unidad viene de la **Orden de Venta** (`createdfrom`): campo `custbody_kop_costotransporte` (join en la búsqueda de facturas).

### 4.4 Nota Crédito Proveedor (descuento simulado)

- Custom Record **customrecord_descuento_proveedor**.  
  - Campos: **custrecord_dp_articulo** (multi-select), **custrecord_dp_cliente**, **custrecord_dp_proveedor**, **custrecord_dp_factor**, **custrecord_dp_fecha_inicio**, **custrecord_dp_fecha_fin**.  
  - Criterio: artículo de la línea **está en** la lista de artículos del registro, mismo cliente, mismo proveedor (si aplica), fecha de la transacción entre inicio y fin.  
  - Fórmula: **Nota Crédito Proveedor = Tipo de Cambio × Cantidad × Factor**.

### 4.5 Fórmulas principales por línea

- **Costo Total** = COSTO + Transporte − Nota Crédito Proveedor  
- **Utilidad Bruta** = Ingreso (importe) − Costo Total  
- **Margen MN** = Utilidad Bruta / Ingreso (si Ingreso > 0)  
- **Ingreso USD / Costo USD / etc.** = Monto / Tipo de Cambio (de la transacción)  
- **Ingreso Casa** = Ingreso USD × Tipo de Cambio Interno (parámetro del reporte, ej. 18)  
- **Comisión por margen**: se busca en **customrecord_parametros_comision** el rango (margen mínimo–máximo) donde cae el margen % de la línea; se usa el **porcentaje de comisión** de ese rango.  
- **Comisión** = (% comisión en decimal) × Ingreso Casa  
- **Comisiones por gerente**: en **Employee** (salesrep) se leen campos `custentity_comision_rosario`, `custentity_comision_alhely`, etc. (porcentajes).  
  - Compensación por gerente = (porcentaje / 100) × Ingreso Casa.  
- **Utilidad después de comisiones de gerencia** = Utilidad Bruta − Comisión total gerentes  
- **% Margen** (final) = Utilidad después de comisiones de gerencia / Ingreso  

(Todas las fórmulas detalladas están en **calculateExcelFormulas** y en la guía de lectura rápida.)

---

## 5. Configuración requerida en NetSuite

- **Custom Record – Parámetros de comisión**: `customrecord_parametros_comision`  
  - `custrecord_margen_minimo`, `custrecord_margen_maximo`, `custrecord_porcentaje_comision`.  
- **Custom Record – Descuento proveedor**: `customrecord_descuento_proveedor`  
  - `custrecord_dp_articulo` (multi-select), `custrecord_dp_cliente`, `custrecord_dp_proveedor`, `custrecord_dp_factor`, `custrecord_dp_fecha_inicio`, `custrecord_dp_fecha_fin`.  
- **Employee**: campos de comisión por gerente (`custentity_comision_rosario`, etc.).  
- **Cuenta 5100**: existe en el plan contable (Materia Prima).  
- **Suitelet de exportación**: script y deploy configurados en variables `EXPORT_SUITELET_SCRIPT_ID` y `EXPORT_SUITELET_DEPLOY_ID` (y carpeta de archivos en el Export Suitelet).

---

## 6. Exportación a CSV

- El Suitelet principal puede guardar el resultado en **archivos JSON** en File Cabinet (por trozos si hay muchas filas) y devolver un **fileId** (índice).  
- El cliente (navegador) llama al **ReporteRentabilidadExportSuitelet** con `fileId` (o envía `data` en JSON).  
- El Export Suitelet lee los datos, genera el CSV con las mismas columnas que la tabla del reporte y devuelve descarga (redirect a MEDIA_ITEM o URL de descarga).  
- Cabeceras y formato de filas están en **ReporteRentabilidadExportSuitelet.js** (CSV_HEADERS, rowToCsvValues, formatFechaForExport, etc.).

---

## 7. Filtros del reporte

- Fechas desde/hasta, período contable.  
- Tipo: todos / solo facturas / solo notas de crédito (en la práctica se usa “todos” o filtro por ID).  
- Clase, ubicación, cliente, giro industrial, representante de ventas, artículo.  
- **ID Factura / Nota de Crédito**: si se informa, se filtra por ese internalid (facturas y NC); para NC además se aplica filtro en memoria por si la búsqueda devuelve más de una.  
- Tipo de cambio interno (para Ingreso Casa).

---

## 8. Logs de auditoría

- Título **ReporteRentabilidad**: mensajes de flujo (params, pasos 1a/1b/1c/1d, resultados de búsquedas, filtro NC, etc.).  
- Título **ReporteRentabilidad Tiempos**: JSON con tiempos por paso (inicio, comisionParams, invoiceSearch, createForm, total_ms, registros).  
Útil para depurar filtros, costo 0 en NC o facturas con varias EPAs.

---

## 9. Continuar el desarrollo

- Ver **ReporteRentabilidad_LECTURA_RAPIDA.md** para ubicar funciones, caches y fórmulas en el código.  
- Al agregar columnas: tocar tanto el Suitelet principal (búsquedas / construcción de filas / calculateExcelFormulas si aplica) como el Export (CSV_HEADERS y rowToCsvValues).  
- Al cambiar reglas de costo o comisiones: revisar `executeInvoiceSearch`, `getFulfillmentAccountingImpactByItem`, `preloadItemReceiptAccountingImpact`, `loadComisionParams`, `getComisionPorMargen`, `loadComisionesGerentesCache`, `getFactorDescuentoProveedor` y `calculateExcelFormulas`.
