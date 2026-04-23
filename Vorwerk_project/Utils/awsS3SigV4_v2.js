/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/https'], function (https) {
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function amzDates(now) {
    var y = now.getUTCFullYear();
    var m = pad2(now.getUTCMonth() + 1);
    var d = pad2(now.getUTCDate());
    var hh = pad2(now.getUTCHours());
    var mm = pad2(now.getUTCMinutes());
    var ss = pad2(now.getUTCSeconds());
    return {
      dateStamp: '' + y + m + d,
      amzDate: '' + y + m + d + 'T' + hh + mm + ss + 'Z',
    };
  }

  function ensureString(v) {
    if (v === null || v === undefined) return '';
    return typeof v === 'string' ? v : String(v);
  }

  // --- Crypto (pure JS) ---
  // Implementación mínima de SHA-256 + HMAC-SHA256 en JS para evitar incompatibilidades con N/crypto.
  function rotr(n, x) {
    return (x >>> n) | (x << (32 - n));
  }
  function ch(x, y, z) {
    return (x & y) ^ (~x & z);
  }
  function maj(x, y, z) {
    return (x & y) ^ (x & z) ^ (y & z);
  }
  function sig0(x) {
    return rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
  }
  function sig1(x) {
    return rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
  }
  function gam0(x) {
    return rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
  }
  function gam1(x) {
    return rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);
  }
  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function utf8ToBytes(str) {
    str = ensureString(str);
    var bytes = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      else if (c < 0xd800 || c >= 0xe000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      else {
        i++;
        var c2 = str.charCodeAt(i);
        var u = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff));
        bytes.push(0xf0 | (u >> 18), 0x80 | ((u >> 12) & 0x3f), 0x80 | ((u >> 6) & 0x3f), 0x80 | (u & 0x3f));
      }
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    var hex = '';
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i] & 0xff;
      hex += (b < 16 ? '0' : '') + b.toString(16);
    }
    return hex;
  }

  function sha256Bytes(msgBytes) {
    var l = msgBytes.length;
    var bitLenHi = (l / 0x20000000) | 0;
    var bitLenLo = (l << 3) >>> 0;

    // padding
    msgBytes = msgBytes.slice();
    msgBytes.push(0x80);
    while ((msgBytes.length % 64) !== 56) msgBytes.push(0);
    // length 64-bit big-endian
    msgBytes.push((bitLenHi >>> 24) & 0xff, (bitLenHi >>> 16) & 0xff, (bitLenHi >>> 8) & 0xff, bitLenHi & 0xff);
    msgBytes.push((bitLenLo >>> 24) & 0xff, (bitLenLo >>> 16) & 0xff, (bitLenLo >>> 8) & 0xff, bitLenLo & 0xff);

    var H0 = 0x6a09e667, H1 = 0xbb67ae85, H2 = 0x3c6ef372, H3 = 0xa54ff53a;
    var H4 = 0x510e527f, H5 = 0x9b05688c, H6 = 0x1f83d9ab, H7 = 0x5be0cd19;

    var W = new Array(64);
    for (var i = 0; i < msgBytes.length; i += 64) {
      for (var t = 0; t < 16; t++) {
        var j = i + t * 4;
        W[t] = ((msgBytes[j] << 24) | (msgBytes[j + 1] << 16) | (msgBytes[j + 2] << 8) | (msgBytes[j + 3])) >>> 0;
      }
      for (t = 16; t < 64; t++) {
        W[t] = (gam1(W[t - 2]) + W[t - 7] + gam0(W[t - 15]) + W[t - 16]) >>> 0;
      }

      var a = H0, b = H1, c = H2, d = H3, e = H4, f = H5, g = H6, h = H7;
      for (t = 0; t < 64; t++) {
        var T1 = (h + sig1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
        var T2 = (sig0(a) + maj(a, b, c)) >>> 0;
        h = g; g = f; f = e; e = (d + T1) >>> 0;
        d = c; c = b; b = a; a = (T1 + T2) >>> 0;
      }
      H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
      H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0; H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
    }

    var out = [];
    var H = [H0, H1, H2, H3, H4, H5, H6, H7];
    for (i = 0; i < H.length; i++) {
      out.push((H[i] >>> 24) & 0xff, (H[i] >>> 16) & 0xff, (H[i] >>> 8) & 0xff, H[i] & 0xff);
    }
    return out;
  }

  function sha256Hex(str) {
    return bytesToHex(sha256Bytes(utf8ToBytes(str)));
  }

  function sha256HexUint8Array(u8) {
    if (!u8 || u8.length === 0) return sha256Hex('');
    var bytes = [];
    for (var i = 0; i < u8.length; i++) {
      bytes.push(u8[i] & 0xff);
    }
    return bytesToHex(sha256Bytes(bytes));
  }

  function hmacSha256Bytes(keyBytes, msgBytes) {
    var blockSize = 64;
    if (keyBytes.length > blockSize) keyBytes = sha256Bytes(keyBytes);
    if (keyBytes.length < blockSize) {
      var zeros = new Array(blockSize - keyBytes.length);
      for (var i = 0; i < zeros.length; i++) zeros[i] = 0;
      keyBytes = keyBytes.concat(zeros);
    }
    var oKeyPad = [], iKeyPad = [];
    for (i = 0; i < blockSize; i++) {
      oKeyPad[i] = keyBytes[i] ^ 0x5c;
      iKeyPad[i] = keyBytes[i] ^ 0x36;
    }
    return sha256Bytes(oKeyPad.concat(sha256Bytes(iKeyPad.concat(msgBytes))));
  }

  function getSignatureKeyBytes(secretAccessKey, dateStamp, region, service) {
    var kSecret = utf8ToBytes('AWS4' + ensureString(secretAccessKey));
    var kDate = hmacSha256Bytes(kSecret, utf8ToBytes(dateStamp));
    var kRegion = hmacSha256Bytes(kDate, utf8ToBytes(region));
    var kService = hmacSha256Bytes(kRegion, utf8ToBytes(service));
    var kSigning = hmacSha256Bytes(kService, utf8ToBytes('aws4_request'));
    return kSigning;
  }

  function normalizeS3Key(key) {
    if (!key) return '';
    key = String(key).replace(/^\/*/, '');
    key = key.replace(/\.\.(\/|\\)/g, '');
    return key;
  }

  function s3Host(bucket, region) {
    // Para este proyecto fijamos región por defecto us-east-2.
    region = region || 'us-east-2';
    return bucket + '.s3.' + region + '.amazonaws.com';
  }

  function canonicalizeUri(path) {
    // Mantener "/" sin escapar; encodeURI deja "/" intacto y escapa espacios, etc.
    return '/' + encodeURI(normalizeS3Key(path)).replace(/%2F/g, '/');
  }

  function signHeaders(params) {
    var bucket = params.bucket;
    var region = params.region || 'us-east-2';
    var accessKeyId = params.accessKeyId;
    var secretAccessKey = params.secretAccessKey;
    var method = params.method;
    var canonicalUri = params.canonicalUri;
    var canonicalQueryString = params.canonicalQueryString || '';
    var payloadHash = params.payloadHash;

    var service = 's3';
    var now = params.now || new Date();
    var dates = amzDates(now);

    var host = s3Host(bucket, region);
    var canonicalHeaders =
      'host:' +
      host +
      '\n' +
      'x-amz-content-sha256:' +
      payloadHash +
      '\n' +
      'x-amz-date:' +
      dates.amzDate +
      '\n';
    var signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    var canonicalRequest = [method, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join('\n');
    var credentialScope = dates.dateStamp + '/' + region + '/' + service + '/aws4_request';
    var stringToSign =
      'AWS4-HMAC-SHA256\n' + dates.amzDate + '\n' + credentialScope + '\n' + sha256Hex(canonicalRequest);

    var signingKeyBytes = getSignatureKeyBytes(secretAccessKey, dates.dateStamp, region, service);
    var signature = bytesToHex(hmacSha256Bytes(signingKeyBytes, utf8ToBytes(stringToSign)));

    var authorizationHeader =
      'AWS4-HMAC-SHA256 ' +
      'Credential=' +
      accessKeyId +
      '/' +
      credentialScope +
      ', ' +
      'SignedHeaders=' +
      signedHeaders +
      ', ' +
      'Signature=' +
      signature;

    return {
      host: host,
      amzDate: dates.amzDate,
      authorization: authorizationHeader,
      payloadHash: payloadHash,
    };
  }

  function putObject(params) {
    var bucket = params.bucket;
    var region = params.region || 'us-east-2';
    var accessKeyId = params.accessKeyId;
    var secretAccessKey = params.secretAccessKey;
    var objectKey = normalizeS3Key(params.objectKey);
    var bodyU8 = params.bodyUint8Array;
    var body = params.body;
    var contentType = params.contentType || 'application/octet-stream';

    if (!bucket) throw new Error('S3 bucket requerido');
    if (!accessKeyId) throw new Error('S3 accessKeyId requerido');
    if (!secretAccessKey) throw new Error('S3 secretAccessKey requerido');
    if (!objectKey) throw new Error('S3 objectKey requerido');

    var host = s3Host(bucket, region);
    var canonicalUri = canonicalizeUri(objectKey);

    // PDF/binario: usar bodyUint8Array + SuiteScript 2.1 https.put para bytes crudos.
    // Un string en el body se envía como UTF-8 y rompe bytes >127 → PDF en blanco en S3.
    var payloadHash;
    var bodyForHttps;
    if (bodyU8 && typeof bodyU8.length === 'number' && bodyU8.length >= 0) {
      payloadHash = sha256HexUint8Array(bodyU8);
      bodyForHttps = bodyU8;
    } else {
      bodyForHttps = ensureString(body);
      payloadHash = sha256Hex(bodyForHttps);
    }

    var sig = signHeaders({
      bucket: bucket,
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      method: 'PUT',
      canonicalUri: canonicalUri,
      canonicalQueryString: '',
      payloadHash: payloadHash,
      now: params.now,
    });

    var url = 'https://' + host + canonicalUri;
    var headers = {
      'Content-Type': contentType,
      Host: host,
      'x-amz-date': sig.amzDate,
      'x-amz-content-sha256': sig.payloadHash,
      Authorization: sig.authorization,
    };

    return https.put({ url: url, headers: headers, body: bodyForHttps });
  }

  function getBucketLocation(params) {
    var bucket = params.bucket;
    var region = params.region || 'us-east-2';
    var accessKeyId = params.accessKeyId;
    var secretAccessKey = params.secretAccessKey;

    if (!bucket) throw new Error('S3 bucket requerido');
    if (!accessKeyId) throw new Error('S3 accessKeyId requerido');
    if (!secretAccessKey) throw new Error('S3 secretAccessKey requerido');

    var host = s3Host(bucket, region);
    var canonicalUri = '/';
    var canonicalQueryString = 'location=';
    var payloadHash = sha256Hex('');
    var sig = signHeaders({
      bucket: bucket,
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      method: 'GET',
      canonicalUri: canonicalUri,
      canonicalQueryString: canonicalQueryString,
      payloadHash: payloadHash,
      now: params.now,
    });

    var url = 'https://' + host + '/?' + canonicalQueryString;
    var headers = {
      Host: host,
      'x-amz-date': sig.amzDate,
      'x-amz-content-sha256': sig.payloadHash,
      Authorization: sig.authorization,
    };

    return https.get({ url: url, headers: headers });
  }

  function headObject(params) {
    var bucket = params.bucket;
    var region = params.region || 'us-east-2';
    var accessKeyId = params.accessKeyId;
    var secretAccessKey = params.secretAccessKey;
    var objectKey = normalizeS3Key(params.objectKey);

    if (!bucket) throw new Error('S3 bucket requerido');
    if (!accessKeyId) throw new Error('S3 accessKeyId requerido');
    if (!secretAccessKey) throw new Error('S3 secretAccessKey requerido');
    if (!objectKey) throw new Error('S3 objectKey requerido');

    var host = s3Host(bucket, region);
    var canonicalUri = canonicalizeUri(objectKey);
    var payloadHash = sha256Hex('');
    var sig = signHeaders({
      bucket: bucket,
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      method: 'HEAD',
      canonicalUri: canonicalUri,
      canonicalQueryString: '',
      payloadHash: payloadHash,
      now: params.now,
    });

    return https.request({
      method: https.Method.HEAD,
      url: 'https://' + host + canonicalUri,
      headers: {
        Host: host,
        'x-amz-date': sig.amzDate,
        'x-amz-content-sha256': sig.payloadHash,
        Authorization: sig.authorization,
      },
    });
  }

  function deleteObject(params) {
    var bucket = params.bucket;
    var region = params.region || 'us-east-2';
    var accessKeyId = params.accessKeyId;
    var secretAccessKey = params.secretAccessKey;
    var objectKey = normalizeS3Key(params.objectKey);

    if (!bucket) throw new Error('S3 bucket requerido');
    if (!accessKeyId) throw new Error('S3 accessKeyId requerido');
    if (!secretAccessKey) throw new Error('S3 secretAccessKey requerido');
    if (!objectKey) throw new Error('S3 objectKey requerido');

    var host = s3Host(bucket, region);
    var canonicalUri = canonicalizeUri(objectKey);
    var payloadHash = sha256Hex('');
    var sig = signHeaders({
      bucket: bucket,
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      method: 'DELETE',
      canonicalUri: canonicalUri,
      canonicalQueryString: '',
      payloadHash: payloadHash,
      now: params.now,
    });

    return https.request({
      method: https.Method.DELETE,
      url: 'https://' + host + canonicalUri,
      headers: {
        Host: host,
        'x-amz-date': sig.amzDate,
        'x-amz-content-sha256': sig.payloadHash,
        Authorization: sig.authorization,
      },
    });
  }

  return {
    putObject: putObject,
    getBucketLocation: getBucketLocation,
    headObject: headObject,
    deleteObject: deleteObject,
  };
});

