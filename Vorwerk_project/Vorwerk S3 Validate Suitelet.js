/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/log', 'N/file', './Utils/awsS3SigV4_v2'], function (runtime, log, file, S3) {
  function safeXmlText(xml, tag) {
    var re = new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>', 'i');
    var m = re.exec(xml || '');
    return m && m[1] ? String(m[1]).trim() : '';
  }

  function safeName(name) {
    return String(name || 'archivo')
      .replace(/[^\w.\-]+/g, '_')
      .replace(/^_+/, '')
      .substring(0, 120);
  }

  function safeKeyPart(v) {
    return String(v || '')
      .replace(/[^\w\-./]+/g, '_')
      .replace(/^_+/, '')
      .substring(0, 200);
  }

  function onRequest(context) {
    if (context.request.method !== 'GET') {
      context.response.write(JSON.stringify({ ok: false, error: 'Método no soportado' }));
      return;
    }

    try {
      var scriptObj = runtime.getCurrentScript();
      // En esta cuenta ya existen parámetros con sufijo "2" en NetSuite.
      // Mantenemos compatibilidad dejando fallback a los nombres sin sufijo.
      var bucket =
        scriptObj.getParameter({ name: 'custscript_vw_s3_bucket2' }) ||
        scriptObj.getParameter({ name: 'custscript_vw_s3_bucket' });
      var region =
        scriptObj.getParameter({ name: 'custscript_vw_s3_region2' }) ||
        scriptObj.getParameter({ name: 'custscript_vw_s3_region' }) ||
        'us-east-2';
      var accessKeyId =
        scriptObj.getParameter({ name: 'custscript_vw_s3_access_key2' }) ||
        scriptObj.getParameter({ name: 'custscript_vw_s3_access_key' });
      var secretAccessKey =
        scriptObj.getParameter({ name: 'custscript_vw_s3_secret_key2' }) ||
        scriptObj.getParameter({ name: 'custscript_vw_s3_secret_key' });

      if (!S3 || typeof S3.getBucketLocation !== 'function') {
        throw new Error('No se pudo cargar awsS3SigV4_v2.getBucketLocation (verifica que el archivo esté en File Cabinet y que el path del módulo sea correcto).');
      }

      var res = S3.getBucketLocation({
        bucket: bucket,
        region: region,
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      });

      var body = res && typeof res.body === 'string' ? res.body : '';
      var locationConstraint = safeXmlText(body, 'LocationConstraint'); // vacío = us-east-1
      var errCode = safeXmlText(body, 'Code');
      var errMessage = safeXmlText(body, 'Message');
      var requestId = safeXmlText(body, 'RequestId');

      // (Opcional) Generar y subir "hola mundo" sin depender de File Cabinet
      // Uso:
      // - GET ...&putHelloWorld=T                      (usa objectKey=hola_mundo.txt)
      // - GET ...&putHelloWorld=T&objectKey=hola.txt
      var helloParam = context.request.parameters.putHelloWorld;
      var shouldHello = helloParam === true || helloParam === 'T' || helloParam === 'true';
      var helloResult = null;
      if (shouldHello) {
        if (!S3 || typeof S3.putObject !== 'function') {
          throw new Error('No se pudo cargar awsS3SigV4_v2.putObject');
        }
        var helloKeyParam = context.request.parameters.objectKey;
        var helloKey = String(helloKeyParam || 'hola_mundo.txt');
        var helloRes = S3.putObject({
          bucket: bucket,
          region: region,
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          objectKey: helloKey,
          contentType: 'text/plain; charset=utf-8',
          body: 'hola mundo',
        });
        helloResult = {
          objectKey: helloKey,
          httpCode: helloRes && helloRes.code ? helloRes.code : null,
          bodySnippet: helloRes && typeof helloRes.body === 'string' ? helloRes.body.substring(0, 500) : '',
        };
      }

      // (Opcional) Validación de "envío de archivo" a S3 (PUT Object)
      // Uso:
      // - GET ...&uploadFile=T              (usa fileId por defecto 2984879)
      // - GET ...&uploadFile=T&fileId=12345
      // - GET ...&uploadFile=T&prefix=validaciones
      //
      // Simulación del objectKey real (como Email massive Map.js):
      // - GET ...&simulateRealKey=T&periodText=04/2026&idReporte=99999&empId=33&firstName=Pilar&lastName=Torres
      var uploadFileParam = context.request.parameters.uploadFile;
      var shouldUpload = uploadFileParam === true || uploadFileParam === 'T' || uploadFileParam === 'true';
      var uploadResult = null;
      if (shouldUpload) {
        if (!S3 || typeof S3.putObject !== 'function') {
          throw new Error('No se pudo cargar awsS3SigV4_v2.putObject');
        }

        var simulateParam = context.request.parameters.simulateRealKey;
        var simulateRealKey = simulateParam === true || simulateParam === 'T' || simulateParam === 'true';

        var fileIdParam = context.request.parameters.fileId;
        var fileId = parseInt(fileIdParam || '2984879', 10);
        if (!fileId || isNaN(fileId)) {
          throw new Error('fileId inválido');
        }

        var prefixParam = context.request.parameters.prefix;
        var prefix = String(prefixParam || 'validacion');

        var f = file.load({ id: fileId });
        var contents = f.getContents();

        var objectKey;
        if (simulateRealKey) {
          var periodText = String(context.request.parameters.periodText || '04/2026');
          var m = /(\d{1,2})\s*\/\s*(\d{4})/.exec(periodText);
          var month = m ? (m[1].length === 1 ? '0' + m[1] : m[1]) : '04';
          var year = m ? m[2] : '2026';
          var idReporte = safeKeyPart(context.request.parameters.idReporte || '99999');
          var empIdVal = safeKeyPart(context.request.parameters.empId || '33');
          var firstName = safeKeyPart(context.request.parameters.firstName || 'Pilar');
          var lastName = safeKeyPart(context.request.parameters.lastName || 'Torres');

          objectKey = 'Reporte_' + idReporte + '_' + empIdVal + '_' + firstName + '_' + lastName + '_' + year + '_' + month + '_' + '.pdf';
        } else {
          objectKey =
            prefix +
            '/netsuite/' +
            fileId +
            '/' +
            new Date().toISOString().replace(/[:.]/g, '-') +
            '-' +
            safeName(f.name);
        }

        var putRes = S3.putObject({
          bucket: bucket,
          region: region,
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          objectKey: objectKey,
          contentType: simulateRealKey ? 'application/pdf' : 'application/octet-stream',
          body: contents,
        });

        uploadResult = {
          fileId: fileId,
          fileName: f.name,
          objectKey: objectKey,
          simulateRealKey: simulateRealKey,
          httpCode: putRes && putRes.code ? putRes.code : null,
          bodySnippet: putRes && typeof putRes.body === 'string' ? putRes.body.substring(0, 1000) : '',
        };
      }

      // (Opcional) Consulta de un archivo en S3 (HEAD Object) sin descargar contenido
      // Uso:
      // - GET ...&headObject=T&objectKey=reg_99999_emp_12345_04_2026_JDG.pdf
      var headParam = context.request.parameters.headObject;
      var shouldHead = headParam === true || headParam === 'T' || headParam === 'true';
      var headResult = null;
      if (shouldHead) {
        if (!S3 || typeof S3.headObject !== 'function') {
          throw new Error('No se pudo cargar awsS3SigV4_v2.headObject');
        }
        var objectKeyParam = context.request.parameters.objectKey;
        if (!objectKeyParam) throw new Error('objectKey requerido para headObject');

        var headRes = S3.headObject({
          bucket: bucket,
          region: region,
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          objectKey: objectKeyParam,
        });

        var h = (headRes && headRes.headers) ? headRes.headers : {};
        headResult = {
          objectKey: String(objectKeyParam),
          httpCode: headRes && headRes.code ? headRes.code : null,
          contentType: h['Content-Type'] || h['content-type'] || null,
          contentLength: h['Content-Length'] || h['content-length'] || null,
          eTag: h['ETag'] || h['etag'] || null,
          lastModified: h['Last-Modified'] || h['last-modified'] || null,
        };
      }

      // (Opcional) DELETE Object (remove) en S3
      // Uso:
      // - GET ...&deleteObject=T&objectKey=Reporte_33_Pilar_Torres_2026_04_01_1.pdf
      var delParam = context.request.parameters.deleteObject;
      var shouldDelete = delParam === true || delParam === 'T' || delParam === 'true';
      var deleteResult = null;
      if (shouldDelete) {
        if (!S3 || typeof S3.deleteObject !== 'function') {
          throw new Error('No se pudo cargar awsS3SigV4_v2.deleteObject');
        }
        var delKey = context.request.parameters.objectKey;
        if (!delKey) throw new Error('objectKey requerido para deleteObject');
        var delRes = S3.deleteObject({
          bucket: bucket,
          region: region,
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          objectKey: delKey,
        });
        deleteResult = {
          objectKey: String(delKey),
          httpCode: delRes && delRes.code ? delRes.code : null,
          bodySnippet: delRes && typeof delRes.body === 'string' ? delRes.body.substring(0, 1000) : '',
        };
      }

      // (Opcional) UPDATE (overwrite) del archivo en S3: PUT al mismo objectKey
      // Uso:
      // - GET ...&updateObject=T&objectKey=Reporte_33_Pilar_Torres_2026_04_01_1.pdf&fileId=2984879
      var updParam = context.request.parameters.updateObject;
      var shouldUpdate = updParam === true || updParam === 'T' || updParam === 'true';
      var updateResult = null;
      if (shouldUpdate) {
        if (!S3 || typeof S3.putObject !== 'function') {
          throw new Error('No se pudo cargar awsS3SigV4_v2.putObject');
        }
        var updKey = context.request.parameters.objectKey;
        if (!updKey) throw new Error('objectKey requerido para updateObject');
        var updFileId = parseInt(context.request.parameters.fileId || '2984879', 10);
        if (!updFileId || isNaN(updFileId)) throw new Error('fileId inválido para updateObject');
        var uf = file.load({ id: updFileId });
        var uRes = S3.putObject({
          bucket: bucket,
          region: region,
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
          objectKey: updKey,
          contentType: 'application/octet-stream',
          body: uf.getContents(),
        });
        updateResult = {
          objectKey: String(updKey),
          fileId: updFileId,
          fileName: uf.name,
          httpCode: uRes && uRes.code ? uRes.code : null,
          bodySnippet: uRes && typeof uRes.body === 'string' ? uRes.body.substring(0, 1000) : '',
        };
      }

      context.response.addHeader({ name: 'Content-Type', value: 'application/json' });
      context.response.write(
        JSON.stringify({
          ok: String(res && res.code ? res.code : '') === '200',
          httpCode: res.code,
          bucket: bucket,
          signedRegion: region,
          bucketRegion: locationConstraint || 'us-east-1',
          s3Error: errCode
            ? {
                code: errCode,
                message: errMessage,
                requestId: requestId,
              }
            : null,
          helloWorld: helloResult,
          upload: uploadResult,
          head: headResult,
          update: updateResult,
          delete: deleteResult,
          // útil para diagnóstico; truncamos para no devolver demasiado
          s3Body: body ? body.substring(0, 2000) : '',
        })
      );
    } catch (e) {
      log.error('S3 validate error', e);
      context.response.addHeader({ name: 'Content-Type', value: 'application/json' });
      context.response.write(
        JSON.stringify({
          ok: false,
          error: String(e && e.message ? e.message : e),
        })
      );
    }
  }

  return { onRequest: onRequest };
});

