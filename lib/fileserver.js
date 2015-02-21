"use strict";


var fs = require('fs'),
  mmm = require('mmmagic'),
  Magic = mmm.Magic,
  crypto = require('crypto'),
  path = require('path'),
  os = require('os');

/** Limit values **/
var UPLOAD_DIR = process.env.FSRV_UPLOAD_DIR || path.join(__dirname, '../uploads');


var Fileserver = function () {
  return function (req, res, next) {

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
      stream.on('error', function(err){
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