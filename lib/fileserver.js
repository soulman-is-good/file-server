"use strict";


var fs = require('fs'),
  mmm = require('mmmagic'),
  Magic = mmm.Magic,
  crypto = require('crypto'),
  path = require('path'),
  os = require('os');

var Fileserver = function () {
  return function (req, res, next) {

    console.log(req.method, req.url, req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip);
    res.header('Access-Control-Allow-Origin', req.headers['origin'] || 'http://vitrine.kz');
    res.header('Access-Control-Allow-Credentials', "true");
    res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, HEAD');
    res.header('Access-Control-Allow-Headers', 'origin, content-type, accept, x-csrf-token, x-sessionid, x-projectkey');

    if (req.method === "OPTIONS") {
      return res.end();
    }
    if (req.query.flowTotalChunks) {
      res.status(404);
      return res.json({
        'success': true,
        'files': [],
        'get': req.query,
        'post': req.body,
        //optional
        'flowTotalSize': req.query['flowTotalSize'],
        'flowIdentifier': req.query['flowIdentifier'],
        'flowFilename': req.query['flowFilename'],
        'flowRelativePath': req.query['flowRelativePath']
      });
    }

    req.storeFile = function (stream, done) {
      var MimeType = null;
      var mimeDb = require('mime-db');
      var sha1 = crypto.createHash('sha1');
      var magic = new Magic(mmm.MAGIC_MIME_TYPE);
      var src = path.join(os.tmpDir(), Date.now().toString(36));
      var tmpFile = fs.createWriteStream(src);
      stream.on('data', function (data) {
        if (!tmpFile.write(data)) {
          tmpFile.once('drain', function () {
            stream.resume();
          });
          stream.pause();
        }
        sha1.update(data);
      });
      stream.on('end', function () {
        tmpFile.once('finish', function () {
          magic.detectFile(src, function (err, result) {
            if (err) {
              console.error("mmmagic detect", err.stack);
            } else {
              MimeType = result;
            }
            var ext = '.' + (((mimeDb[MimeType] && mimeDb[MimeType].extensions) || [])[0] || 'bin');
            var newfilename = sha1.digest('hex') + ext;
            var dest = path.join(UPLOAD_DIR, newfilename);
            if (fs.existsSync(dest)) {
              done(null, newfilename, MimeType);
            } else {
              fs.rename(src, dest, function (err) {
                done(err, newfilename, MimeType);
              });
            }
          });
        });
        tmpFile.end();
      });
      stream.on('error', function (err) {
        console.error(err.stack);
      });
    };

    res.doneFileDownload = function (err, newfilename, MimeType) {
      var res = this;
      if (err) {
        console.error(err.stack);
        res.statusCode = 500;
        res.json({filename: newfilename, error: err.message, mimetype: MimeType});
      } else {
        res.json({filename: newfilename, mimetype: MimeType});
      }
    };

    next();
  };
};

module.exports = Fileserver;