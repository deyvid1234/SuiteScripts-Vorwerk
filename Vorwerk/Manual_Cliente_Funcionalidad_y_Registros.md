# Reporte de Rentabilidad  
## Guía de usuario y fuentes de información en NetSuite

| | |
|---|---|
| **Documento** | Manual funcional — Reporte de Rentabilidad |
| **Versión** | 1.0 · marzo 2026 |
| **Ámbito** | Uso del reporte en Oracle NetSuite y origen de los datos que muestra |

---

### Introducción

Este documento está dirigido a **equipos de negocio, finanzas y operaciones** que utilizan el Reporte de Rentabilidad. Explica **para qué sirve el informe**, **cómo consultarlo**, y **de qué datos de NetSuite depende** cada resultado. Comprender esas fuentes permite mantener la información al día y interpretar correctamente las cifras.

El reporte **consolida y calcula** a partir de transacciones y tablas de parámetros ya existentes en NetSuite. **No sustituye** por sí solo a los estados financieros oficiales ni modifica registros en el sistema: refleja las reglas de negocio definidas para este informe.

---

### 1. Finalidad del reporte

El Reporte de Rentabilidad permite analizar, **por línea de factura o de nota de crédito**:

- importes de venta y costos (materia prima y transporte);  
- descuentos acordados con proveedores (cuando apliquen);  
- utilidad, márgenes y comisiones (por margen, por gerente de ventas y concepto “Otros”);  
- importes en moneda de la transacción y en USD, según la configuración;  
- exportación a hoja de cálculo (formato CSV) para análisis externo.

La **calidad del resultado** depende de que las **transacciones** estén correctamente registradas y de que los **parámetros y tablas auxiliares** (comisiones, descuentos, vigencias) reflejen la política vigente de la organización.

---

### 2. Uso habitual

1. **Acceso:** abrir el reporte desde el menú o enlace que su organización haya configurado en NetSuite.  
2. **Filtros:** indicar el rango de fechas (y, si aplica, período contable, cliente, clase, ubicación, representante de ventas, artículo, tipo de documento, u otros filtros disponibles).  
3. **Generación:** pulsar la acción equivalente a **Generar reporte** para que el sistema consulte las facturas y notas de crédito y aplique los cálculos.  
4. **Exportación:** si se desea trabajar en Excel u otra herramienta, utilizar la opción de **exportar a CSV**; el archivo reproduce las columnas del reporte en pantalla.

**Consulta rápida frente a datos en tiempo real:** en entornos con gran volumen, puede existir una **precarga por periodos** (por mes) que agiliza la respuesta. Esa precarga **no reemplaza** la contabilidad: **reproduce la misma lógica** sobre los mismos datos de origen y se actualiza cuando se ejecuta el proceso automático correspondiente (según la programación acordada con sistemas).

---

### 3. Origen de la información en NetSuite

La siguiente tabla relaciona **qué aspecto del negocio** se refleja en el reporte, **dónde reside en NetSuite** y **qué ocurre si los datos de origen son incorrectos o están incompletos**.

| Lo que necesita el análisis | Dónde se registra en NetSuite (resumen) | Efecto en el reporte si el dato de origen falla |
|----------------------------|-------------------------------------------|------------------------------------------------|
| Ventas e importes por línea | **Facturas de cliente** y **notas de crédito** (líneas de artículo consideradas por el reporte) | Importes, fechas o clientes erróneos |
| Relación entre venta, entrega y costo | **Orden de venta** → **ejecución de pedido (Item Fulfillment)** | Coste de materia prima incorrecto o no asignado |
| Costo de materia prima (columna COSTO) | **Apuntes contables** del fulfillment (y, en notas de crédito, de la recepción) sobre la **cuenta de materia prima** definida para el reporte (habitualmente la cuenta **5100**, según su plan de cuentas) | COSTO en cero o desviado |
| Costo en devoluciones (notas de crédito) | **Autorización de devolución** → **recepción de artículos (Item Receipt)** y la misma lógica de cuenta de materia prima | Costos de notas de crédito incorrectos |
| Transporte | **Costo de transporte** en la **orden de venta** desde la que se generó la factura | Transporte mal calculado |
| Tipo de cambio | **Tipo de cambio** en la factura o nota de crédito | Conversiones a USD e importes equivalentes incorrectos |
| Fecha ajustada de vencimiento | **Campo personalizado** en la transacción | Columna vacía o desactualizada |
| Comisión según margen de la línea | Registro **Parámetros de comisión** (rangos de margen y porcentaje asociado) | Porcentajes que no coinciden con la política actual |
| Reparto entre gerentes de ventas (p. ej. Rosario, Alhely, …) | Registro **Comisiones por empleado** (por empleado, con **fechas de vigencia**) | Reparto de comisiones incorrecto o desactualizado |
| “Nota crédito proveedor” (ajuste sobre costo) | Registro **Descuento proveedor** (cliente, artículos, proveedor si aplica, factor, vigencia) | Descuentos aplicados en exceso o insuficientes |
| Concepto “Otros” (% o monto por tonelada) | Registro de **compensación cliente–artículo** (nombre puede variar en su cuenta; a veces bajo la etiqueta de comisiones “Otros”) | Columna “Otros” incorrecta |
| Datos maestros de análisis | **Cliente**, **categoría de cliente**, **artículo**, **ubicación** | Filtros y columnas incoherentes con la realidad |
| Representante de ventas | **Empleado** indicado como representante en la transacción | Comisiones asociadas a otra persona |
| Coherencia contable del costo | Cuenta de **materia prima** utilizada en los apuntes de inventario (p. ej. **5100**) alineada con su contabilidad | Desajuste entre el reporte y la contabilidad oficial |

**En síntesis:** el reporte **lee** lo que ya existe en NetSuite. **No corrige** errores de captura. Si un precio, costo, porcentaje o vigencia es incorrecto en origen, el informe mostrará un resultado coherente con ese dato erróneo.

---

### 4. Reglas de negocio (resumen)

- **Facturas:** el costo de materia prima se obtiene a partir de la **ejecución de pedido (fulfillment)** vinculada a la venta, usando la cuenta de materia prima configurada. Si existen varias entregas para la misma orden, se aplican criterios de **emparejamiento** (artículo, cantidad, fechas; en algunos casos detalle de inventario o serie).  
- **Notas de crédito:** el costo se basa en la **recepción** asociada a la devolución, expresado de forma **inversa** a las ventas.  
- **Transporte:** procede del dato registrado en la **orden de venta** que originó la factura.  
- **Descuento proveedor:** solo aplica cuando existe un registro en **Descuento proveedor** que coincida con cliente, artículo, proveedor (cuando corresponda) y **fecha de la transacción dentro del periodo de vigencia** del registro.  
- **Comisión por margen:** según el margen de la línea, se identifica el tramo aplicable en **Parámetros de comisión**.  
- **Comisiones de gerentes:** se toman de **Comisiones por empleado** vigente para el periodo analizado y para el representante de la línea.  
- **Otros:** se determina mediante la tabla de **compensación cliente–artículo** (y ubicación, si aplica), respetando vigencias y prioridades cuando hay varios registros candidatos.

---

### 5. Precarga por mes (cuando esté disponible)

Sirve para **reducir el tiempo de espera** al consultar rangos amplios. Consiste en **información precalculada por mes**, almacenada en la **biblioteca de archivos** de NetSuite, generada por un **proceso automático** acordado con el equipo de sistemas (por ejemplo, programación nocturna o manual).  
Si la precarga no está actualizada, suele poder utilizarse la **consulta directa** a los datos (más lenta, pero basada en los mismos orígenes).

---

### 6. Exportación a CSV

La exportación **no cambia las reglas de negocio**: toma el resultado ya calculado por el reporte y lo presenta en formato **CSV**, alineado con las columnas visibles.  
Cualquier corrección debe realizarse **en NetSuite** (transacciones y tablas de parámetros); después conviene **volver a ejecutar** el reporte y exportar de nuevo.

---

### 7. Recomendaciones de uso y mantenimiento de datos

1. **Responsables:** designar personas o áreas responsables del mantenimiento de **Parámetros de comisión**, **Comisiones por empleado**, **Descuento proveedor** y la tabla de **compensación “Otros”**, con flujo de altas, bajas y aprobaciones.  
2. **Vigencias:** al cambiar políticas, definir fechas de inicio y fin claras para los registros; evitar solapamientos no intencionados entre periodos.  
3. **Inventario y contabilidad:** revisar que las entregas y recepciones generen los **apuntes** esperados en la cuenta de materia prima acordada.  
4. **Órdenes de venta:** verificar **costo de transporte** y **representante de ventas** antes de facturar, cuando esos datos impacten en el reporte.  
5. **Incidencias:** ante diferencias persistentes entre el reporte y la contabilidad, conviene acudir al **equipo de administración de NetSuite** o al **proveedor de soporte** que tenga asignada su cuenta.

---

### 8. Nombres en pantalla y plan de cuentas

Los **nombres comerciales** de los registros personalizados y el **número exacto de la cuenta contable** pueden variar según la configuración de cada empresa. En NetSuite, la referencia definitiva es **Personalización** (registros y campos) y el **plan de cuentas**. Este documento utiliza **denominaciones funcionales** para facilitar la lectura.

---

### Documento de entrega

Guía de usuario y referencia de datos del **Reporte de Rentabilidad** en NetSuite.  
Uso interno: **[Nombre de la organización / cliente]**.
