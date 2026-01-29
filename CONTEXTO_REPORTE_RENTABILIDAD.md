# Contexto del Proyecto: Reporte de Rentabilidad

## Información General del Proyecto

**Proyecto:** SuiteScripts-Vorwerk  
**Archivo Principal:** `Vorwerk/ReporteRentabilidadSuitelet.js`  
**Tipo de Script:** Suitelet (SuiteScript 2.0)  
**Propósito:** Generar reporte de rentabilidad con cálculos de ganancias, comisiones, costos e impacto contable

## Descripción del Suitelet

El Suitelet genera un reporte de rentabilidad que:
- Busca transacciones de Invoice (Facturas de Venta y Notas de Crédito)
- Calcula utilidades, márgenes y comisiones
- Obtiene costos desde accounting postings
- Permite filtros por fecha, cliente, artículo, representante de ventas, etc.
- Exporta resultados a Excel

## Estructura del Código

### Funciones Principales

1. **`onRequest(context)`** - Función principal del Suitelet
   - Maneja GET (formulario de filtros) y POST (mostrar reporte o exportar)

2. **`showFilterForm(context)`** - Muestra formulario inicial de filtros

3. **`executeInvoiceSearch(filters)`** - Ejecuta búsqueda principal de Invoices
   - Busca transacciones tipo CustInvc/CustCred
   - Obtiene Item Fulfillments relacionados con Sales Orders
   - Calcula impacto contable por fulfillment

4. **`getItemFulfillmentsBySalesOrder(salesOrderId)`** - Obtiene fulfillments de un Sales Order
   - Retorna array de objetos con `id` y `tranid`

5. **`getFulfillmentAccountingImpact(fulfillmentId, invoiceId)`** - Obtiene costo del fulfillment
   - Busca cuenta 5100 (Materia Prima) por número
   - Busca accounting postings del fulfillment para esa cuenta
   - Retorna costo total (suma de valores absolutos)

6. **`calculateExcelFormulas(row)`** - Calcula fórmulas del Excel
   - INGRESO, COSTO, TRANSPORTE, COSTO TOTAL
   - UTILIDAD BRUTA, conversiones a USD
   - MARGEN, porcentaje de comisión, comisiones totales

7. **`showReport(context)`** - Muestra el reporte en formulario

8. **`createReportForm(results, scriptId, deploymentId, filters)`** - Crea formulario con resultados
   - Usa serverWidget para crear sublist con resultados
   - Incluye filtros para regenerar reporte

9. **`exportToExcel(context)`** - Exporta resultados a Excel (formato XML)

## Campos del Reporte

### Campos Principales (en orden de visualización)

1. **Formulario** - Custom form del invoice
2. **Fecha** - Fecha de la transacción
3. **Período** - Período contable
4. **Tipo** - Tipo de transacción (Factura de Venta / Nota de Crédito)
5. **Clase** - Clasificación del item
6. **Ubicación** - Ubicación
7. **FV** - Número de Documento (tranid del invoice)
8. **OV** - Sales Order TranId (tranid del sales order)
9. **EPA** - Fulfillment TranId (tranid del fulfillment)
10. **Cliente** - Cliente
11. **GIRO INDUSTRIAL** - Categoría del cliente
12. **Artículo** - Artículo
13. **Representante de Ventas** - Representante de ventas
14. **Cantidad** - Cantidad (tipo FLOAT)
15. **Importe** - Importe de la línea
16. **Método de Entrega** - Método de entrega
17. **Costo Transporte** - Costo de transporte del Sales Order
18. **Tipo de Cambio** - Tipo de cambio (custbody_drt_exchangerate_custom)
19. **Moneda** - Moneda de la transacción
20. **Tax Code** - Código de impuesto
21. **Objeto de Impuesto** - Tax Item (objeto de impuesto)
22. **COSTO** - Costo del fulfillment (cuenta 5100 Materia Prima)

### Campos Calculados (en calculateExcelFormulas)

- `montoBase` - INGRESO
- `costoBase` - COSTO
- `costoTransporteCalculado` - TRANSPORTE
- `costoTotal` - COSTO TOTAL
- `utilidadBruta` - UTILIDAD BRUTA
- `montoBaseUSD`, `costoBaseUSD`, `costoTotalUSD` - Conversiones a USD
- `utilidadUSD` - Utilidad en USD
- `margen` - Margen de ganancia
- `porcentajeComision` - Porcentaje de comisión según margen
- `comisionTotal` - Comisión total
- `utilidadDespuesComisiones` - Utilidad después de comisiones
- `margenFinal` - Margen final

## Cambios Realizados en Esta Conversación

### 1. Corrección de Error: Campo Cantidad
- **Problema:** Error `INVALID_FLD_VALUE` para campo `cantidad` con valor decimal (500.0)
- **Solución:** Cambio de tipo de campo de `INTEGER` a `FLOAT` (el usuario lo cambió)
- **Ubicación:** Línea ~1012

### 2. Cambio de Labels
- "Costo Transporte Created" → "Costo Transporte"
- "Número de Documento" → "FV"
- "Sales Order TranId" → "OV"
- "Fulfillment TranId" → "EPA"

### 3. Reordenamiento de Campos
- Campos OV y EPA movidos para aparecer justo después de FV
- Orden actual: FV, OV, EPA, Cliente, ...

### 4. Nuevos Campos Añadidos

#### Tipo de Cambio
- **Campo:** `custbody_drt_exchangerate_custom` del invoice
- **Variable:** `tipoCambio`
- **Tipo:** FLOAT
- **Label:** "Tipo de Cambio"

#### Moneda
- **Campo:** `currency` del invoice
- **Variable:** `moneda`
- **Tipo:** TEXT
- **Label:** "Moneda"

#### Tax Code
- **Campo:** `taxcode` del invoice
- **Variable:** `taxCode`
- **Tipo:** TEXT
- **Label:** "Tax Code"

#### Objeto de Impuesto (Tax Item)
- **Campo:** `taxitem` del invoice
- **Variable:** `taxItem`
- **Tipo:** TEXT
- **Label:** "Objeto de Impuesto"

#### COSTO (Impacto Contable)
- **Origen:** Accounting posting del fulfillment
- **Cuenta:** 5100 (Materia Prima)
- **Variable:** `costo`
- **Tipo:** CURRENCY
- **Label:** "COSTO"
- **Función:** `getFulfillmentAccountingImpact()`

### 5. Implementación de Impacto Contable

**Función:** `getFulfillmentAccountingImpact(fulfillmentId, invoiceId)`

**Proceso:**
1. Busca la cuenta 5100 usando el campo `number` (no `accountnumber`)
2. Busca accounting postings del fulfillment filtrados por:
   - `transaction` = fulfillmentId
   - `account` = cuenta 5100
   - `posting` = 'T' (posteado)
   - `mainline` = 'F' (solo líneas, no principal)
3. Suma valores absolutos de los montos
4. Retorna costo total

**Error Corregido:**
- Error inicial: `SSS_INVALID_SRCH_FILTER` con `accountnumber`
- Solución: Cambio a campo `number` para buscar cuenta

### 6. Nota Crédito Proveedor (Descuento simulado)

- **Concepto:** No son notas de crédito reales; es un “descuento” simulado donde el proveedor “descuenta” el monto solo si se vende a cierto cliente (como si se devolviera material para efecto de costo).
- **Custom Record:** "Descuento Proveedor" (`customrecord_descuento_proveedor`).
- **Campos del Custom Record:**
  - `custrecord_dp_articulo` (Item) - Artículo
  - `custrecord_dp_cliente` (Customer) - Cliente
  - `custrecord_dp_proveedor` (Vendor) - Proveedor
  - `custrecord_dp_factor` (Decimal) - **Factor Descuento** (ej. 0.05 = 5% sobre el costo)
  - `custrecord_dp_fecha_inicio` (Date) - Fecha Inicio Vigencia
  - `custrecord_dp_fecha_fin` (Date) - Fecha Fin Vigencia
- **Lógica:** Al generar el reporte se hace una búsqueda global del Custom Record. Por cada línea se consulta si existe un registro que coincida en Artículo, Cliente, Proveedor y que la fecha de la factura esté entre Fecha Inicio y Fecha Fin. Si existe, se toma el factor; si no, 0.
- **Cálculo:** `notaCreditoProveedor = costo * factor`
- **Fórmula:** COSTO TOTAL = COSTO + TRANSPORTE - Nota Crédito Proveedor
- **Proveedor por línea:** Se obtiene del proveedor preferido del ítem (`preferredvendor`, join item) en la búsqueda del invoice.
- **Funciones:** `loadDescuentoProveedorCache()`, `getFactorDescuentoProveedor(row)`
- **Campo en reporte:** "Nota Crédito Proveedor" (CURRENCY)

## Configuración Requerida

### Custom Record Type: "Parámetros de Comisión"
- **ID Interno:** `customrecord_parametros_comision`
- **Campos:**
  - `custrecord_margen_minimo` (Number/Decimal) - Margen mínimo del rango
  - `custrecord_margen_maximo` (Number/Decimal) - Margen máximo del rango
  - `custrecord_porcentaje_comision` (Percent) - Porcentaje de comisión

**Valores por Defecto (si no existe Custom Record):**
- Rango 1: Min: 20, Max: 100, Porcentaje: 0.50%
- Rango 2: Min: 15, Max: 20, Porcentaje: 0.47%
- Rango 3: Min: 10, Max: 15, Porcentaje: 0.27%
- Rango 4: Min: 5, Max: 10, Porcentaje: 0.20%
- Rango 5: Min: 0, Max: 5, Porcentaje: 0.12%
- Rango 6: Min: -100, Max: 0, Porcentaje: 0%

### Cuenta Contable Requerida
- **Cuenta 5100:** Materia Prima (debe existir en NetSuite)

### Custom Record Type: "Descuento Proveedor" (Nota Crédito Proveedor simulada)
- **ID Interno:** `customrecord_descuento_proveedor` (ajustar si aplica)
- **Campos:** Artículo, Cliente, Proveedor, Factor Descuento (decimal, ej. 0.05), Fecha Inicio Vigencia, Fecha Fin Vigencia
- **Nombre recomendado del campo del factor:** "Factor Descuento" (número como 0.05, no porcentaje 5)

## Filtros Disponibles

### Filtros Principales (siempre visibles)
- ID de Invoice
- Fecha Desde
- Fecha Hasta

### Filtros Adicionales (colapsables)
- Período
- Tipo (Factura de Venta / Nota de Crédito)
- Clase
- Ubicación
- Cliente
- GIRO INDUSTRIAL
- Representante de Ventas
- Artículo

## Búsqueda Principal

**Tipo:** `transaction`  
**Filtros Base:**
- `type` = 'CustInvc'
- `status` NOT IN ('CustInvc:D', 'CustInvc:E', 'CustInvc:V')
- `taxline` = 'F'
- `cogs` = 'F'
- `mainline` = 'F'
- `quantity` > 0

**Joins Utilizados:**
- `item` (para clase)
- `customermain` (para GIRO INDUSTRIAL)
- `createdfrom` (para Sales Order - costo transporte y tranid)

## Estructura de Datos

### Objeto `row` (cada línea del reporte)

```javascript
{
    // Campos de Invoice
    customForm: string,
    fecha: date,
    periodo: string,
    type: string,
    clase: string,
    ubicacion: string,
    numeroDocumento: string,
    cliente: string,
    giroIndustrial: string,
    articulo: string,
    representanteVenta: string,
    cantidad: number,
    importe: number,
    metodoEntrega: string,
    tipoCambio: number,
    moneda: string,
    taxCode: string,
    taxItem: string,
    costoTransporteCreated: number,
    salesOrderTranId: string,
    fulfillmentTranId: string,
    costo: number, // COSTO del fulfillment (cuenta 5100)
    
    // IDs para referencias
    invoiceId: string,
    salesOrderId: string,
    fulfillmentId: string,
    
    // Impacto contable
    accountingImpact: number
}
```

## Funciones de Utilidad

- **`formatNumber(num)`** - Formatea número con separadores de miles
- **`formatPercent(num)`** - Formatea porcentaje
- **`escapeXml(text)`** - Escapa caracteres XML para exportación
- **`mapTransactionTypeToSpanish(typeId, typeText)`** - Mapea tipos a español
- **`loadComisionParams()`** - Carga parámetros de comisión (con cache)
- **`getComisionPorMargen(margen)`** - Obtiene porcentaje de comisión según margen

## Estado Actual

### Funcionalidades Completadas ✅
- Búsqueda de Invoices con filtros
- Obtención de Fulfillments relacionados
- Cálculo de impacto contable (cuenta 5100)
- Cálculo de fórmulas del Excel
- Formulario con sublist de resultados
- Exportación a Excel
- Todos los campos solicitados integrados

### Campos en Sublist (orden actual)
1. Formulario
2. Fecha
3. Período
4. Tipo
5. Clase
6. Ubicación
7. FV (Número de Documento)
8. OV (Sales Order TranId)
9. EPA (Fulfillment TranId)
10. Cliente
11. GIRO INDUSTRIAL
12. Artículo
13. Representante de Ventas
14. Cantidad
15. Importe
16. Método de Entrega
17. Costo Transporte
18. Tipo de Cambio
19. Moneda
20. Tax Code
21. Objeto de Impuesto
22. COSTO

## Notas Importantes

1. **Campo Cantidad:** Tipo FLOAT (no INTEGER) para aceptar decimales
2. **Búsqueda de Cuenta:** Usar campo `number` (no `accountnumber`)
3. **Accounting Postings:** Se buscan en tipo `transaction` con filtros específicos
4. **Costo:** Se calcula sumando valores absolutos de los montos de accounting posting
5. **Cache de Parámetros:** Los parámetros de comisión se cachean para mejor rendimiento

## Próximos Pasos Sugeridos

1. Verificar que la cuenta 5100 existe y tiene el número correcto
2. Probar con diferentes fulfillments para validar el cálculo de costo
3. Validar que los accounting postings se están generando correctamente
4. Revisar si se necesitan ajustes en el cálculo de comisiones
5. Considerar añadir más campos calculados si es necesario

## Archivos Relacionados

- `Vorwerk/ReporteRentabilidadSuitelet.js` - Archivo principal
- `Vorwerk/INSTRUCCIONES_REPORTE_RENTABILIDAD.md` - Instrucciones (si existe)

## Versión

**Última Actualización:** 27 de Enero, 2026  
**Líneas de Código:** ~1646  
**Estado:** Funcional, listo para pruebas
