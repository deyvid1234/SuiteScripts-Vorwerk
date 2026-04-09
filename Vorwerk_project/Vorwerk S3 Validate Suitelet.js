/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/log', './Utils/awsS3SigV4_v2'], function (runtime, log, S3) {
  function safeXmlText(xml, tag) {
    var re = new RegExp('<' + tag + '>([\\s\\S]*?)<\\/' + tag + '>', 'i');
    var m = re.exec(xml || '');
    return m && m[1] ? String(m[1]).trim() : '';
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
        'us-east-1';
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

